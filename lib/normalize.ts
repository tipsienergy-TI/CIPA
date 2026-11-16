/** minúsculo, sem acentos, espaços colapsados — base da busca e da deduplicação */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeKey(name: string, registration?: string | null): string {
  return `${normalizeName(name)}|${(registration ?? "").trim()}`;
}

export function maskRegistration(reg?: string | null): string | null {
  if (!reg) return null;
  const r = reg.trim();
  return r.length <= 3 ? r : `••••${r.slice(-3)}`;
}
