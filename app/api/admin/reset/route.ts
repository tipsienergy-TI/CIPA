import type { NextRequest } from "next/server";
import { fail, ok, serverError } from "@/lib/http";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Zera votos e libera todos os eleitores (útil para testes antes da eleição real).
export async function POST(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("confirm") !== "1") return fail("Confirmação ausente.");
    const { error } = await db().rpc("reset_election");
    if (error) throw error;
    return ok({ ok: true });
  } catch (e) {
    return serverError(e, "reset");
  }
}
