import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { fail, ok, serverError } from "@/lib/http";
import { db, isVotingOpen } from "@/lib/supabase";
import { VOTER_COOKIE, cookieOptions, signToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

const VOTER_SESSION_SECONDS = 15 * 60; // tempo para concluir o voto

// Confirma o eleitor escolhido no autocompletar e abre uma sessão curta (cookie assinado).
export async function POST(req: NextRequest) {
  try {
    const { voterId } = (await req.json().catch(() => ({}))) as { voterId?: string };
    if (!voterId) return fail("Selecione seu nome na lista.");

    if (!(await isVotingOpen())) return fail("A votação não está aberta no momento.", 403);

    const { data: voter, error } = await db()
      .from("voters")
      .select("id,has_voted")
      .eq("id", voterId)
      .maybeSingle();
    if (error) throw error;
    if (!voter) return fail("Nome não encontrado na lista de eleitores.", 404);
    if (voter.has_voted) return fail("Este colaborador já registrou o voto.", 409);

    const token = await signToken({ role: "voter", vid: voter.id }, `${VOTER_SESSION_SECONDS}s`);
    cookies().set(VOTER_COOKIE, token, cookieOptions(VOTER_SESSION_SECONDS));
    return ok({ ok: true });
  } catch (e) {
    return serverError(e, "voter:identify");
  }
}
