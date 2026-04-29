import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSignedUrl } from "@/lib/recruiting/storage";

export async function GET(_: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const profile = await requireCurrentProfile();
    const { fileId } = await params;
    const { data, error } = await getSupabaseAdmin()
      .from("candidate_files")
      .select("storage_path, company_id")
      .eq("id", fileId)
      .eq("company_id", profile.company_id)
      .single();
    if (error) throw new Error(error.message);
    const url = await createSignedUrl("candidate-cvs", data.storage_path);
    return NextResponse.redirect(url);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 404 });
  }
}
