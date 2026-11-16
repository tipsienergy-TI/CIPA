import { cookies } from "next/headers";
import { ok } from "@/lib/http";
import { ADMIN_COOKIE } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST() {
  cookies().delete(ADMIN_COOKIE);
  return ok({ ok: true });
}
