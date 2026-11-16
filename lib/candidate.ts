export type CandidateInput = { name: string; department: string; photo_url: string | null };
export type ParsedCandidate = { ok: true; value: CandidateInput } | { ok: false; error: string };

/** Validação compartilhada do cadastro de candidato (POST e PUT). */
export function parseCandidate(body: unknown): ParsedCandidate {
  const b = (body ?? {}) as { name?: unknown; department?: unknown; photo_url?: unknown };
  const name = typeof b.name === "string" ? b.name.replace(/\s+/g, " ").trim() : "";
  const department = typeof b.department === "string" ? b.department.trim() : "";
  const photo = typeof b.photo_url === "string" ? b.photo_url.trim() : "";
  if (name.length < 3) return { ok: false, error: "Informe o nome completo." };
  if (!department) return { ok: false, error: "Informe o setor/departamento." };
  if (photo && !/^https?:\/\//i.test(photo)) {
    return { ok: false, error: "A foto deve ser uma URL http(s) ou um upload." };
  }
  return { ok: true, value: { name, department, photo_url: photo || null } };
}
