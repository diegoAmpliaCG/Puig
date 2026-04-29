import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decryptText } from "@/lib/crypto";
import { downloadDriveDocument } from "@/lib/google/drive";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { auditLog } from "@/lib/recruiting/audit";
import { extractTextFromBuffer, extensionFromName, fileHash, safeFileName } from "@/lib/recruiting/files";
import { uploadPrivateFile } from "@/lib/recruiting/storage";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const profile = await requireCurrentProfile();
    if (profile.role !== "admin" && profile.role !== "gestor") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    const token = (await cookies()).get("google_drive_refresh_token")?.value;
    if (!token) throw new Error("Google Drive no conectado.");
    const refreshToken = decryptText(token);
    const body = await request.json();
    const jobId = String(body.jobId);
    const jd = body.jobDescription as { id: string; name: string; mimeType: string } | null;
    const cvs = (body.cvs ?? []) as { id: string; name: string; mimeType: string }[];
    const supabase = getSupabaseAdmin();

    if (jd) {
      const downloaded = await downloadDriveDocument(refreshToken, jd.id, jd.mimeType);
      const ext = extensionFromName(jd.name);
      const storagePath = `${profile.company_id}/${jobId}/job-description.${ext}`;
      await uploadPrivateFile("job-descriptions", storagePath, downloaded.buffer, downloaded.mimeType);
      const extracted = await extractTextFromBuffer(jd.name, downloaded.mimeType, downloaded.buffer);
      await supabase.from("job_files").insert({
        company_id: profile.company_id,
        job_id: jobId,
        source: "drive",
        drive_file_id: jd.id,
        file_name: jd.name,
        file_type: downloaded.mimeType,
        storage_path: storagePath,
        file_role: "job_description",
      });
      await supabase.from("jobs").update({ job_description_text: extracted, job_description_file_path: storagePath, status: "cv_selection" }).eq("id", jobId);
      await auditLog({ companyId: profile.company_id, entityType: "job", entityId: jobId, action: "import_jd_drive", actorUserId: profile.id });
    }

    for (const cv of cvs) {
      const downloaded = await downloadDriveDocument(refreshToken, cv.id, cv.mimeType);
      const baseName = safeFileName(cv.name).replace(/\.[^.]+$/, "");
      const { data: candidate, error } = await supabase.from("candidates").insert({
        company_id: profile.company_id,
        job_id: jobId,
        name: baseName || cv.name,
        source: "drive",
        status: "selected",
      }).select("id").single();
      if (error) throw new Error(error.message);

      const ext = extensionFromName(cv.name);
      const storagePath = `${profile.company_id}/${jobId}/${candidate.id}/original.${ext}`;
      await uploadPrivateFile("candidate-cvs", storagePath, downloaded.buffer, downloaded.mimeType);
      await supabase.from("candidate_files").insert({
        company_id: profile.company_id,
        candidate_id: candidate.id,
        drive_file_id: cv.id,
        file_name: cv.name,
        file_hash: fileHash(downloaded.buffer),
        storage_path: storagePath,
        mime_type: downloaded.mimeType,
      });
      await auditLog({ companyId: profile.company_id, entityType: "candidate", entityId: candidate.id, action: "import_cv", actorUserId: profile.id, metadata: { source: "drive" } });
    }

    return NextResponse.json({ imported: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error importando Drive" }, { status: 400 });
  }
}
