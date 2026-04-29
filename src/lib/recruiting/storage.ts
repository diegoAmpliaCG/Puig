import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function uploadPrivateFile(bucket: string, path: string, buffer: Buffer, contentType: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

export async function downloadPrivateFile(bucket: string, path: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw new Error(error?.message || "No se pudo leer archivo");
  return Buffer.from(await data.arrayBuffer());
}

export async function createSignedUrl(bucket: string, path: string, expiresIn = 60 * 10) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
