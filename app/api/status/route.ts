import { ok, serverError } from "@/lib/http";
import { isVotingOpen } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ votingOpen: await isVotingOpen() });
  } catch (e) {
    return serverError(e, "status");
  }
}
