import type { NextRequest } from "next/server";
import { fail, ok, serverError } from "@/lib/http";
import { db, isVotingOpen } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ votingOpen: await isVotingOpen() });
  } catch (e) {
    return serverError(e, "settings:get");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { votingOpen } = (await req.json().catch(() => ({}))) as { votingOpen?: unknown };
    if (typeof votingOpen !== "boolean") return fail("Valor inválido.");
    const { error } = await db()
      .from("settings")
      .upsert({ key: "voting_open", value: String(votingOpen) }, { onConflict: "key" });
    if (error) throw error;
    return ok({ votingOpen });
  } catch (e) {
    return serverError(e, "settings:put");
  }
}
