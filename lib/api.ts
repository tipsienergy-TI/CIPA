export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** fetch JSON com tratamento de erro padronizado ({ error: string }) */
export async function api<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  const headers: HeadersInit = init.body && !isForm ? { "Content-Type": "application/json" } : {};
  const res = await fetch(url, { cache: "no-store", ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* sem corpo */
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? "Erro inesperado.";
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Erro inesperado.");
