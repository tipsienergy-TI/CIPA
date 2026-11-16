import { ok, serverError } from "@/lib/http";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Público: a cédula precisa listar os candidatos (nenhum dado sensível).
export async function GET() {
  try {
    const { data, error } = await db()
      .from("candidates")
      .select("id,name,department,photo_url")
      .order("name");
    if (error) throw error;
    return ok(data);
  } catch (e) {
    return serverError(e, "candidates:list");
  }
}
