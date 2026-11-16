import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { fail, ok, serverError } from "@/lib/http";
import { db, isVotingOpen } from "@/lib/supabase";
import { getVoterId } from "@/lib/session";
import { VOTER_COOKIE } from "@/lib/jwt";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Registro do voto.
 * - Identidade vem do cookie assinado (não do corpo da requisição).
 * - cast_vote() marca has_voted E grava o voto anônimo na mesma transação;
 *   a tabela `votes` não guarda quem votou nem quando.
 */
export async function POST(req: NextRequest) {
  try {
    const voterId = await getVoterId();
    if (!voterId) return fail("Sessão expirada. Identifique-se novamente.", 401);
    if (!(await isVotingOpen())) return fail("A votação não está aberta no momento.", 403);

    const body = (await req.json().catch(() => ({}))) as { candidateId?: string; blank?: boolean };
    const blank = body.blank === true;
    const candidateId = blank ? null : body.candidateId ?? null;

    if (!blank) {
      if (!candidateId || !UUID.test(candidateId)) return fail("Candidato inválido.");
      const { data: cand, error } = await db()
        .from("candidates")
        .select("id")
        .eq("id", candidateId)
        .maybeSingle();
      if (error) throw error;
      if (!cand) return fail("Candidato não encontrado.", 404);
    }

    const { data: accepted, error } = await db().rpc("cast_vote", {
      p_voter: voterId,
      p_candidate: candidateId,
      p_blank: blank,
    });
    if (error) throw error;

    cookies().delete(VOTER_COOKIE); // encerra a sessão do eleitor em qualquer caso
    if (!accepted) return fail("Este colaborador já registrou o voto.", 409);
    return ok({ ok: true });
  } catch (e) {
    return serverError(e, "vote");
  }
}
