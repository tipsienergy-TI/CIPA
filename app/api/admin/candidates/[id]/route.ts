import type { NextRequest } from "next/server";
import { fail, ok, serverError } from "@/lib/http";
import { db } from "@/lib/supabase";
import { parseCandidate } from "@/lib/candidate";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const parsed = parseCandidate(await req.json().catch(() => null));
    if (!parsed.ok) return fail(parsed.error);
    const { data, error } = await db()
      .from("candidates")
      .update(parsed.value)
      .eq("id", params.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("Candidato não encontrado.", 404);
    return ok(data);
  } catch (e) {
    return serverError(e, "candidates:update");
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { error } = await db().from("candidates").delete().eq("id", params.id);
    if (error) {
      if (error.code === "23503") {
        return fail("Este candidato já recebeu votos. Zere a apuração antes de removê-lo.", 409);
      }
      throw error;
    }
    return ok({ ok: true });
  } catch (e) {
    return serverError(e, "candidates:delete");
  }
}
