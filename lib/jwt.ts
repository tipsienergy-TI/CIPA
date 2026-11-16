// Edge-safe (usado também pelo middleware): sem next/headers, sem bcrypt.
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const ADMIN_COOKIE = "cipa_admin";
export const VOTER_COOKIE = "cipa_voter";

function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET não configurada (mín. 16 caracteres).");
  }
  return new TextEncoder().encode(s);
}

export async function signToken(payload: JWTPayload, expiresIn: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey());
}

export async function verifyToken(token?: string): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
