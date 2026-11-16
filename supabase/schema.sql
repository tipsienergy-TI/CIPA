-- =====================================================================
--  CIPA · Sistema de Votação  —  Schema Supabase (PostgreSQL)
--  Execute no Supabase: SQL Editor > New query > cole tudo > Run
-- =====================================================================

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- CANDIDATOS
-- ---------------------------------------------------------------------
create table if not exists candidates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  department  text not null,
  photo_url   text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ELEITORES (importados da planilha)
-- name_normalized: minúsculo e sem acento (usado na busca/autocompletar)
-- dedupe_key: nome_normalizado|matricula  (evita duplicar na reimportação)
-- has_voted: apenas um booleano. NÃO guardamos data/hora do voto, para
--            que não seja possível cruzar horário do eleitor x voto.
-- ---------------------------------------------------------------------
create table if not exists voters (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  name_normalized  text not null,
  registration     text,
  dedupe_key       text not null unique,
  has_voted        boolean not null default false
);
create index if not exists voters_name_trgm_idx
  on voters using gin (name_normalized gin_trgm_ops);

-- ---------------------------------------------------------------------
-- VOTOS (ANÔNIMOS)
-- Sem voter_id, sem timestamp, id aleatório (uuid): nada liga o voto ao eleitor.
-- is_blank = true  -> voto em branco (candidate_id é NULL)
-- ---------------------------------------------------------------------
create table if not exists votes (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references candidates(id) on delete restrict,
  is_blank      boolean not null default false,
  constraint votes_blank_or_candidate check (
    (is_blank and candidate_id is null) or (not is_blank and candidate_id is not null)
  )
);
create index if not exists votes_candidate_idx on votes (candidate_id);

-- ---------------------------------------------------------------------
-- CONFIGURAÇÕES (ex.: votação aberta/encerrada)
-- ---------------------------------------------------------------------
create table if not exists settings (
  key    text primary key,
  value  text not null
);
insert into settings (key, value) values ('voting_open', 'true')
  on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- SEGURANÇA: RLS ligado e SEM policies = a chave pública (anon) não lê nada.
-- Todo acesso passa pelas rotas /api usando a service_role (só no servidor).
-- ---------------------------------------------------------------------
alter table candidates enable row level security;
alter table voters     enable row level security;
alter table votes      enable row level security;
alter table settings   enable row level security;

-- ---------------------------------------------------------------------
-- REGISTRO DE VOTO — ATÔMICO
-- Marca "já votou" e insere o voto anônimo na MESMA transação.
-- Retorna false se o eleitor já tinha votado (trava contra duplo voto,
-- segura mesmo com dois cliques/abas simultâneas).
-- ---------------------------------------------------------------------
create or replace function cast_vote(p_voter uuid, p_candidate uuid, p_blank boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  update voters set has_voted = true
   where id = p_voter and has_voted = false;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return false;
  end if;

  if p_blank then
    insert into votes (candidate_id, is_blank) values (null, true);
  else
    insert into votes (candidate_id, is_blank) values (p_candidate, false);
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- APURAÇÃO (uma consulta só)
-- ---------------------------------------------------------------------
create or replace function get_results()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'candidates', coalesce((
      select json_agg(x order by x.votes desc, x.name)
      from (
        select c.id, c.name, c.department, c.photo_url, count(v.id)::int as votes
          from candidates c
          left join votes v on v.candidate_id = c.id
         group by c.id
      ) x
    ), '[]'::json),
    'blank',    (select count(*)::int from votes where is_blank),
    'eligible', (select count(*)::int from voters),
    'voted',    (select count(*)::int from voters where has_voted)
  );
$$;

-- ---------------------------------------------------------------------
-- ZERAR ELEIÇÃO (apaga votos e libera todos para votar de novo)
-- ---------------------------------------------------------------------
create or replace function reset_election()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from votes where true;
  update voters set has_voted = false where has_voted;
end;
$$;

-- Funções só podem ser chamadas pelo servidor (service_role)
revoke all on function cast_vote(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function get_results()                  from public, anon, authenticated;
revoke all on function reset_election()               from public, anon, authenticated;
grant execute on function cast_vote(uuid, uuid, boolean) to service_role;
grant execute on function get_results()                  to service_role;
grant execute on function reset_election()               to service_role;

-- ---------------------------------------------------------------------
-- STORAGE: bucket público para as fotos dos candidatos
-- (upload só pelo servidor com service_role; leitura pública das imagens)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('candidates', 'candidates', true)
on conflict (id) do nothing;
