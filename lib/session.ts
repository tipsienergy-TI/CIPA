import { cookies } from "next/headers";
import { ADMIN_COOKIE, VOTER_COOKIE, verifyToken } from "./jwt";

export async function isAdmin(): Promise<boolean> {
  const p = await verifyToken(cookies().get(ADMIN_COOKIE)?.value);
  return p?.role === "admin";
}

/** Retorna o id do eleitor identificado (cookie assinado) ou null. */
export async function getVoterId(): Promise<string | null> {
  const p = await verifyToken(cookies().get(VOTER_COOKIE)?.value);
  return p?.role === "voter" && typeof p.vid === "string" ? p.vid : null;
}
