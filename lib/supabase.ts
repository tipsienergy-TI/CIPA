import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Cliente com service_role — usar SOMENTE em código de servidor (rotas /api). */
export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const PHOTO_BUCKET = "candidates";

export async function isVotingOpen(): Promise<boolean> {
  const { data, error } = await db().from("settings").select("value").eq("key", "voting_open").maybeSingle();
  if (error) throw error; // não esconder falhas do Supabase (tabela ausente, chave errada...)
  return data?.value !== "false";
}
