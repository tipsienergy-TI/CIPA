import { NextResponse } from "next/server";

export const ok = <T,>(data: T, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Traduz os erros mais comuns do Supabase em instruções claras para o administrador. */
function explain(e: unknown): string | null {
  const err = e as { message?: string; code?: string } | null;
  const msg = String(err?.message ?? "");
  const code = err?.code;

  if (/Configure SUPABASE_URL|SESSION_SECRET/i.test(msg)) return msg;
  if (code === "PGRST205" || code === "42P01" || /could not find the table|relation .* does not exist/i.test(msg))
    return "Tabelas não encontradas no Supabase. Rode o arquivo supabase/schema.sql no SQL Editor do seu projeto.";
  if (code === "PGRST202" || /could not find the function/i.test(msg))
    return "Funções do banco não encontradas. Rode novamente o arquivo supabase/schema.sql no SQL Editor.";
  if (/bucket not found/i.test(msg))
    return "O espaço de fotos (bucket 'candidates') não existe. Rode o supabase/schema.sql ou crie um bucket público chamado 'candidates' em Storage.";
  if (/invalid api key|invalid jwt|jwt|PGRST301/i.test(msg) || code === "PGRST301")
    return "Chave do Supabase inválida. Confira SUPABASE_SERVICE_ROLE_KEY (use a service_role, não a anon) e reinicie o servidor.";
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|invalid url/i.test(msg))
    return "Não foi possível conectar ao Supabase. Confira SUPABASE_URL (ex.: https://xxxx.supabase.co, sem /rest/v1) e reinicie o servidor.";
  return null;
}

/** Mostra uma causa útil ao administrador; o detalhe completo vai para o log do servidor. */
export function serverError(e: unknown, context: string) {
  console.error(`[${context}]`, e);
  return fail(explain(e) ?? "Erro interno. Veja o terminal do servidor para o detalhe.", 500);
}
