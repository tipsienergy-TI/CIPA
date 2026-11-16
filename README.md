# Votação CIPA · PSI Energy

Next.js 14 (App Router) + Tailwind + Supabase (Postgres + Storage). Pronto para a Vercel.

## 1. Banco de dados (Supabase, plano gratuito)
1. Crie um projeto em <https://supabase.com>.
2. **SQL Editor → New query** → cole o conteúdo de `supabase/schema.sql` → **Run**
   (cria tabelas, funções, RLS e o bucket público `candidates` para as fotos).
3. **Project Settings → API**: copie a *Project URL* e a chave **service_role**.

## 2. Rodar local
```bash
npm install
cp .env.example .env.local        # preencha os valores
openssl rand -base64 48           # -> SESSION_SECRET
npm run hash -- "SuaSenhaForte"   # -> ADMIN_PASSWORD_HASH
npm run dev
```
No `.env.local`, escape cada `$` do hash como `\$` (o script já imprime as duas versões).

## 3. Deploy na Vercel
1. Suba o projeto para o GitHub e importe na Vercel.
2. Em **Settings → Environment Variables**, cadastre:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`
   (na Vercel o hash vai **sem** escapar os `$`).
3. Deploy. Acesse `/admin`, importe a planilha e cadastre os candidatos.

## Imagens da identidade visual
Tudo centralizado em `lib/brand.ts` (arquivos em `public/images/`):
- `logo-psi.png` → cabeçalho do painel admin e login admin.
- `hero-psi.jpg` → banner da cabine de votação e painel lateral do login.

## Como funciona o sigilo e a trava de duplo voto
- `cast_vote()` (SQL) marca `voters.has_voted = true` **e** insere em `votes` na mesma transação.
  Se o eleitor já votou, retorna `false` — seguro contra duplo clique / duas abas.
- `votes` **não** tem eleitor, data/hora nem id sequencial (só uuid aleatório). `voters` guarda apenas o booleano.
- A identidade do eleitor na cédula vem de um cookie assinado e de curta duração (15 min), nunca do corpo da requisição.
- RLS ligado sem policies: a chave pública não lê nada; só as rotas `/api` (service_role) acessam o banco.

## Planilha de eleitores
`.csv` (UTF-8 ou Windows-1252, `,` ou `;`) ou `.xlsx`. Coluna **Nome** (obrigatória) e **Matrícula**/**CPF** (opcional).
Sem cabeçalho: 1ª coluna = nome, 2ª = matrícula. A leitura é feita no navegador. Reimportar não apaga quem já votou.

## Pontos de atenção
- **Identificação só por nome:** qualquer pessoa que saiba o nome de um colega pode votar por ele. Para evitar,
  vote em um computador supervisionado pela comissão ou exija a matrícula (a coluna já é guardada).
- Não há limite de tentativas na busca de nomes; para uso aberto na internet, adicione rate limiting (ex.: Vercel WAF / Upstash).
- Antes da eleição real, faça um teste e use **Apuração → Zerar apuração**.
