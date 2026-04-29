import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { auditLog } from "@/lib/recruiting/audit";
import { downloadPrivateFile } from "@/lib/recruiting/storage";
import { extractTextFromBuffer } from "@/lib/recruiting/files";
import { evaluateCandidateWithOpenAI } from "@/lib/recruiting/openai";
import type { Candidate, CandidateFile, Job } from "@/lib/recruiting/types";

export async function processJob(jobId: string, actorUserId?: string | null) {
  const supabase = getSupabaseAdmin();
  const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (jobError || !job) throw new Error(jobError?.message || "Cargo no encontrado");
  const typedJob = job as Job;

  await supabase.from("jobs").update({ status: "processing" }).eq("id", jobId);
  await auditLog({
    companyId: typedJob.company_id,
    entityType: "job",
    entityId: jobId,
    action: "process_ranking",
    actorUserId,
  });

  let jobDescription = typedJob.job_description_text?.trim() || "";
  if (!jobDescription && typedJob.job_description_file_path) {
    const jdBuffer = await downloadPrivateFile("job-descriptions", typedJob.job_description_file_path);
    jobDescription = await extractTextFromBuffer("job-description", "application/pdf", jdBuffer);
  }

  if (!jobDescription) throw new Error("No hay Job Description seleccionado.");

  const { data: candidateFiles, error: fileError } = await supabase
    .from("candidates")
    .select("*, candidate_files(*)")
    .eq("job_id", jobId)
    .eq("company_id", typedJob.company_id);
  if (fileError) throw new Error(fileError.message);
  if (!candidateFiles?.length) throw new Error("No hay CVs seleccionados.");

  let processed = 0;
  let failed = 0;

  for (const row of candidateFiles as (Candidate & { candidate_files: CandidateFile[] })[]) {
    const cvFile = row.candidate_files?.[0];
    if (!cvFile) {
      failed += 1;
      continue;
    }

    try {
      await supabase.from("candidates").update({ status: "processing" }).eq("id", row.id);
      const cvBuffer = await downloadPrivateFile("candidate-cvs", cvFile.storage_path);
      const cvText = await extractTextFromBuffer(cvFile.file_name, cvFile.mime_type, cvBuffer);
      if (!cvText) throw new Error("No se pudo extraer texto del CV.");

      const evaluation = await evaluateCandidateWithOpenAI({
        jobTitle: typedJob.title,
        jobDescription,
        cvText,
      });

      await supabase
        .from("candidate_evaluations")
        .upsert(
          {
            company_id: typedJob.company_id,
            candidate_id: row.id,
            job_id: jobId,
            overall_score: evaluation.overall_score,
            recommendation: evaluation.recommendation,
            summary: evaluation.summary,
            strengths_json: evaluation.strengths,
            risks_json: evaluation.risks,
            criteria_json: evaluation.criteria,
            interview_questions_json: evaluation.interview_questions,
            raw_llm_json: evaluation,
            confidence_score: evaluation.confidence_score,
          },
          { onConflict: "candidate_id,job_id" },
        );

      await supabase
        .from("candidates")
        .update({
          name: evaluation.candidate_name || row.name,
          email: evaluation.candidate_email || row.email,
          phone: evaluation.candidate_phone || row.phone,
          status: "ranked",
        })
        .eq("id", row.id);
      processed += 1;
    } catch (error) {
      failed += 1;
      await supabase.from("candidates").update({ status: "selected" }).eq("id", row.id);
      await auditLog({
        companyId: typedJob.company_id,
        entityType: "candidate",
        entityId: row.id,
        action: "process_error",
        actorUserId,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  await supabase.from("jobs").update({ status: "ranking_ready" }).eq("id", jobId);

  return { processed, failed };
}
