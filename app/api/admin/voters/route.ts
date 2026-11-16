import type { NextRequest } from "next/server";
import { fail, ok, serverError } from "@/lib/http";
import { db } from "@/lib/supabase";
import { dedupeKey, normalizeName } from "@/lib/normalize";
import type { VoterRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_ROWS = 20000;
const CHUNK = 500;

// Resumo + amostra da lista (com busca)
export async function GET(req: NextRequest) {
  try {
    const q = normalizeName(req.nextUrl.searchParams.get("q") ?? "");
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 200);

    const [{ count: total }, { count: voted }] = await Promise.all([
      db().from("voters").select("id", { count: "exact", head: true }),
      db().from("voters").select("id", { count: "exact", head: true }).eq("has_voted", true),
    ]);

    let query = db().from("voters").select("id,name,registration,has_voted").order("name_normalized").limit(limit);
    if (q) query = query.ilike("name_normalized", `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
    const { data, error } = await query;
    if (error) throw error;

    return ok({ total: total ?? 0, voted: voted ?? 0, rows: (data ?? []) as VoterRow[] });
  } catch (e) {
    return serverError(e, "voters:list");
  }
}

// Importação (a planilha é lida no navegador; aqui chegam só as linhas já extraídas).
// Mantém quem já existe (e o status "já votou"); só insere os novos.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { rows?: { name?: unknown; registration?: unknown }[] } | null;
    if (!body?.rows || !Array.isArray(body.rows)) return fail("Planilha inválida.");
    if (body.rows.length > MAX_ROWS) return fail(`Máximo de ${MAX_ROWS} linhas por importação.`);

    const map = new Map<string, { name: string; name_normalized: string; registration: string | null; dedupe_key: string }>();
    for (const r of body.rows) {
      const name = typeof r.name === "string" ? r.name.replace(/\s+/g, " ").trim() : "";
      if (name.length < 3) continue;
      const reg = r.registration != null && String(r.registration).trim() !== "" ? String(r.registration).trim() : null;
      const key = dedupeKey(name, reg);
      if (!map.has(key)) map.set(key, { name, name_normalized: normalizeName(name), registration: reg, dedupe_key: key });
    }
    const rows = [...map.values()];
    if (rows.length === 0) return fail("Nenhum nome válido encontrado na planilha.");

    let inserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { data, error } = await db()
        .from("voters")
        .upsert(rows.slice(i, i + CHUNK), { onConflict: "dedupe_key", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;
      inserted += data?.length ?? 0;
    }
    return ok({ received: body.rows.length, valid: rows.length, inserted, skipped: rows.length - inserted });
  } catch (e) {
    return serverError(e, "voters:import");
  }
}

// Limpar a lista de eleitores
export async function DELETE(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("confirm") !== "1") return fail("Confirmação ausente.");
    const { error } = await db().from("voters").delete().not("id", "is", null);
    if (error) throw error;
    return ok({ ok: true });
  } catch (e) {
    return serverError(e, "voters:clear");
  }
}
