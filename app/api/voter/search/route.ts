import type { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/http";
import { db } from "@/lib/supabase";
import { maskRegistration, normalizeName } from "@/lib/normalize";
import type { VoterHit } from "@/lib/types";

export const dynamic = "force-dynamic";

// Autocompletar: mínimo 3 letras, máx. 8 resultados (dificulta listar a base inteira).
export async function GET(req: NextRequest) {
  try {
    const q = normalizeName(req.nextUrl.searchParams.get("q") ?? "");
    if (q.length < 3) return ok<VoterHit[]>([]);

    const safe = q.replace(/[\\%_]/g, (m) => `\\${m}`);
    const { data, error } = await db()
      .from("voters")
      .select("id,name,registration,has_voted")
      .ilike("name_normalized", `%${safe}%`)
      .order("name_normalized")
      .limit(8);
    if (error) throw error;

    const hits: VoterHit[] = (data ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      hint: maskRegistration(v.registration),
      voted: v.has_voted,
    }));
    return ok(hits);
  } catch (e) {
    return serverError(e, "voter:search");
  }
}
