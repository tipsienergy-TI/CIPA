export type SheetRow = { name: string; registration?: string };

const NAME_HEADERS = ["nome", "nome completo", "colaborador", "funcionario", "empregado", "name", "full name"];
const REG_HEADERS = ["matricula", "cpf", "registro", "chapa", "re", "id", "codigo"];

const norm = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Decodifica CSV em UTF-8 e, se não for válido, em Windows-1252 (Excel brasileiro). */
function decodeText(buf: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

/**
 * Lê .csv / .xlsx / .xls NO NAVEGADOR (evita o limite de 4,5 MB de upload da Vercel).
 * Colunas: "Nome"/"Nome Completo" (obrigatória) e "Matrícula"/"CPF" (opcional).
 * Sem cabeçalho reconhecido: 1ª coluna = nome, 2ª = matrícula.
 */
export async function parseVoterSheet(file: File): Promise<SheetRow[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const isCsv = /\.(csv|txt)$/i.test(file.name);
  const wb = isCsv ? XLSX.read(decodeText(buf), { type: "string" }) : XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "", blankrows: false });
  if (grid.length === 0) return [];

  // Cabeçalhos tolerantes: "Nome do Colaborador", "nome_do_colaborador", "NOME - COMPLETO"...
  const header = grid[0].map((h) => norm(h).replace(/[^a-z0-9]+/g, " ").trim());
  let nameCol = header.findIndex(
    (h) => NAME_HEADERS.includes(h) || h.startsWith("nome") || /\b(colaborador|funcionario|empregado)\b/.test(h)
  );
  const regCol = header.findIndex((h) => REG_HEADERS.includes(h) || /\b(matricula|cpf)\b/.test(h));
  const hasHeader = nameCol >= 0;
  if (!hasHeader) nameCol = 0;

  const rows: SheetRow[] = [];
  for (const line of grid.slice(hasHeader ? 1 : 0)) {
    const name = String(line[nameCol] ?? "").replace(/\s+/g, " ").trim();
    if (name.length < 3) continue;
    const rc = hasHeader ? regCol : line.length > 1 ? 1 : -1;
    const registration = rc >= 0 ? String(line[rc] ?? "").trim() : "";
    rows.push(registration ? { name, registration } : { name });
  }
  return rows;
}
