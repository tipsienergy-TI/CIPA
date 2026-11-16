import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { fail, ok, serverError } from "@/lib/http";
import { PHOTO_BUCKET, db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 2 * 1024 * 1024; // o front já reduz a imagem; limite do Vercel é ~4,5 MB

// Upload de foto do candidato para o Supabase Storage -> devolve a URL pública.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("Nenhum arquivo enviado.");
    const ext = TYPES[file.type];
    if (!ext) return fail("Use imagem JPG, PNG ou WEBP.");
    if (file.size > MAX_BYTES) return fail("Imagem acima de 2 MB.");

    const path = `${randomUUID()}.${ext}`;
    const { error } = await db()
      .storage.from(PHOTO_BUCKET)
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (error) throw error;

    const { data } = db().storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return ok({ url: data.publicUrl }, 201);
  } catch (e) {
    return serverError(e, "upload");
  }
}
