import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { fail, ok, serverError } from "@/lib/http";
import { ADMIN_COOKIE, cookieOptions, signToken } from "@/lib/jwt";
import { checkAdminPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

export async function POST(req: NextRequest) {
  try {
    const { password } = (await req.json().catch(() => ({}))) as { password?: string };
    const valid = typeof password === "string" && password.length > 0 && (await checkAdminPassword(password));
    if (!valid) {
      await new Promise((r) => setTimeout(r, 800)); // freia tentativa por força bruta
      return fail("Senha incorreta.", 401);
    }
    const token = await signToken({ role: "admin" }, `${ADMIN_SESSION_SECONDS}s`);
    cookies().set(ADMIN_COOKIE, token, cookieOptions(ADMIN_SESSION_SECONDS));
    return ok({ ok: true });
  } catch (e) {
    return serverError(e, "admin:login");
  }
}
