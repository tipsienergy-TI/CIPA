import { ok, serverError } from "@/lib/http";
import { db } from "@/lib/supabase";
import type { Results } from "@/lib/types";

export const dynamic = "force-dynamic";

// Apuração agregada. Nenhuma informação individual de eleitor é retornada.
export async function GET() {
  try {
    const { data, error } = await db().rpc("get_results");
    if (error) throw error;
    return ok(data as Results);
  } catch (e) {
    return serverError(e, "results");
  }
}
