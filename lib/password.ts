import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Verifica a senha do admin.
 *  1) Preferencial: ADMIN_PASSWORD_HASH (bcrypt)  ->  npm run hash -- "Senha"
 *  2) Alternativa:  ADMIN_PASSWORD (texto puro, comparação em tempo constante)
 */
export async function checkAdminPassword(input: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (hash) return bcrypt.compare(input, hash);

  const plain = process.env.ADMIN_PASSWORD;
  if (plain) {
    const a = crypto.createHash("sha256").update(input).digest();
    const b = crypto.createHash("sha256").update(plain).digest();
    return crypto.timingSafeEqual(a, b);
  }
  return false;
}
