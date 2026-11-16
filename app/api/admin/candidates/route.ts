import type { NextRequest } from "next/server";
import { fail, ok, serverError } from "@/lib/http";
import { db } from "@/lib/supabase";
import { parseCandidate } from "@/lib/candidate";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const parsed = parseCandidate(await req.json().catch(() => null));
    if (!parsed.ok) return fail(parsed.error);
    const { data, error } = await db().from("candidates").insert(parsed.value).select().single();
    if (error) throw error;
    return ok(data, 201);
  } catch (e) {
    return serverError(e, "candidates:create");
  }
}
