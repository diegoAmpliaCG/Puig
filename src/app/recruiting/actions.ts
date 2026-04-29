"use server";

import { addHours } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppUrl, requireEnv } from "@/lib/env";
import { createToken, hashToken } from "@/lib/crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { auditLog } from "@/lib/recruiting/audit";
import { requireCurrentProfile, setCurrentProfileCookie } from "@/lib/recruiting/auth";
import { defaultAvailabilityRules } from "@/lib/recruiting/constants";
import { fileHash, fileToBuffer, safeFileName, extractTextFromBuffer, extensionFromName } from "@/lib/recruiting/files";
import { invitationEmail, sendEmail } from "@/lib/recruiting/email";
import { processJob } from "@/lib/recruiting/process";
import { uploadPrivateFile } from "@/lib/recruiting/storage";
import { getCalendarConnection } from "@/lib/recruiting/db";
import { confirmBooking } from "@/lib/recruiting/booking";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function ensureManager(role: string) {
  if (role !== "admin" && role !== "gestor") throw new Error("Sin permiso");
}

export async function switchUserAction(formData: FormData) {
  await setCurrentProfileCookie(text(formData, "user_id"));
  revalidatePath("/recruiting", "layout");
}

export async function createJobAction(formData: FormData) {
  const profile = await requireCurrentProfile();
  ensureManager(profile.role);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      company_id: profile.company_id,
      title: text(formData, "title"),
      area: text(formData, "area"),
      location: text(formData, "location"),
      modality: text(formData, "modality"),
      seniority: text(formData, "seniority"),
      description: text(formData, "description"),
      job_description_text: text(formData, "job_description_text") || null,
      status: "draft",
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await auditLog({
    companyId: profile.company_id,
    entityType: "job",
    entityId: data.id,
    action: "create_job",
    actorUserId: profile.id,
  });

  redirect(`/recruiting/jobs/${data.id}`);
}

export async function uploadJobDescriptionAction(formData: FormData) {
  const profile = await requireCurrentProfile();
  ensureManager(profile.role);
  const jobId = text(formData, "job_id");
  const supabase = getSupabaseAdmin();
  const file = formData.get("job_description_file") as File | null;
  const jdText = text(formData, "job_description_text");
  let storagePath: string | null = null;
  let extractedText = jdText || null;

  if (file && file.size > 0) {
    const buffer = await fileToBuffer(file);
    const ext = extensionFromName(file.name);
    storagePath = `${profile.company_id}/${jobId}/job-description.${ext}`;
    await uploadPrivateFile("job-descriptions", storagePath, buffer, file.type || "application/octet-stream");
    extractedText = await extractTextFromBuffer(file.name, file.type, buffer);

    await supabase.from("job_files").insert({
      company_id: profile.company_id,
      job_id: jobId,
      source: "upload",
      file_name: file.name,
      file_type: file.type || ext,
      storage_path: storagePath,
      file_role: "job_description",
    });
  }

  if (!extractedText && !storagePath) throw new Error("No hay JD seleccionado.");

  const { error } = await supabase
    .from("jobs")
    .update({
      job_description_text: extractedText,
      job_description_file_path: storagePath,
      status: "cv_selection",
    })
    .eq("company_id", profile.company_id)
    .eq("id", jobId);
  if (error) throw new Error(error.message);

  await auditLog({
    companyId: profile.company_id,
    entityType: "job",
    entityId: jobId,
    action: "upload_job_description",
    actorUserId: profile.id,
  });
  revalidatePath(`/recruiting/jobs/${jobId}`);
}

export async function uploadCandidateFilesAction(formData: FormData) {
  const profile = await requireCurrentProfile();
  ensureManager(profile.role);
  const jobId = text(formData, "job_id");
  const supabase = getSupabaseAdmin();
  const files = formData.getAll("candidate_files").filter((item): item is File => item instanceof File && item.size > 0);
  if (!files.length) throw new Error("No hay CVs seleccionados.");

  for (const file of files) {
    const buffer = await fileToBuffer(file);
    const baseName = safeFileName(file.name).replace(/\.[^.]+$/, "");
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        company_id: profile.company_id,
        job_id: jobId,
        name: baseName || file.name,
        source: "upload",
        status: "selected",
      })
      .select("id")
      .single();
    if (candidateError) throw new Error(candidateError.message);

    const ext = extensionFromName(file.name);
    const storagePath = `${profile.company_id}/${jobId}/${candidate.id}/original.${ext}`;
    await uploadPrivateFile("candidate-cvs", storagePath, buffer, file.type || "application/octet-stream");
    await supabase.from("candidate_files").insert({
      company_id: profile.company_id,
      candidate_id: candidate.id,
      file_name: file.name,
      file_hash: fileHash(buffer),
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
    });

    await auditLog({
      companyId: profile.company_id,
      entityType: "candidate",
      entityId: candidate.id,
      action: "import_cv",
      actorUserId: profile.id,
      metadata: { source: "upload", file_name: file.name },
    });
  }

  await supabase.from("jobs").update({ status: "cv_selection" }).eq("id", jobId);
  revalidatePath(`/recruiting/jobs/${jobId}`);
}

export async function processJobAction(formData: FormData) {
  const profile = await requireCurrentProfile();
  ensureManager(profile.role);
  const jobId = text(formData, "job_id");
  await processJob(jobId, profile.id);
  revalidatePath(`/recruiting/jobs/${jobId}`);
  redirect(`/recruiting/jobs/${jobId}/ranking`);
}

export async function publishJobAction(formData: FormData) {
  const profile = await requireCurrentProfile();
  ensureManager(profile.role);
  const jobId = text(formData, "job_id");
  const teamIds = formData.getAll("team_ids").map(String).filter(Boolean);
  if (!teamIds.length) throw new Error("Selecciona al menos un equipo.");

  const supabase = getSupabaseAdmin();
  await supabase.from("job_publications").delete().eq("company_id", profile.company_id).eq("job_id", jobId);
  const { error } = await supabase.from("job_publications").insert(
    teamIds.map((teamId) => ({
      company_id: profile.company_id,
      job_id: jobId,
      team_id: teamId,
      permissions_json: {
        view_ranking: true,
        view_candidate: true,
        view_cv: true,
        view_llm_comments: true,
        request_interview: true,
      },
      published_by: profile.id,
    })),
  );
  if (error) throw new Error(error.message);

  await supabase.from("jobs").update({ status: "published" }).eq("company_id", profile.company_id).eq("id", jobId);
  await supabase.from("candidates").update({ status: "published" }).eq("company_id", profile.company_id).eq("job_id", jobId).eq("status", "ranked");
  await auditLog({
    companyId: profile.company_id,
    entityType: "job",
    entityId: jobId,
    action: "publish_ranking",
    actorUserId: profile.id,
    metadata: { team_ids: teamIds },
  });
  revalidatePath(`/recruiting/jobs/${jobId}`);
}

export async function requestInterviewAction(formData: FormData) {
  const profile = await requireCurrentProfile();
  const candidateId = text(formData, "candidate_id");
  const jobId = text(formData, "job_id");
  const interviewerId = text(formData, "interviewer_user_id") || profile.id;
  const candidateEmail = text(formData, "candidate_email");
  const durationMinutes = Number(text(formData, "duration_minutes") || "30");
  const interviewType = text(formData, "interview_type") || "screening";
  const message = text(formData, "message");
  const expiresHours = Number(text(formData, "expires_hours") || "72");

  requireEnv("RESEND_API_KEY");
  requireEnv("EMAIL_FROM");
  if (!candidateEmail) throw new Error("No se detectó email.");

  const supabase = getSupabaseAdmin();
  if (profile.role === "team_user") {
    const { data: memberships, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", profile.id);
    if (membershipError) throw new Error(membershipError.message);
    const teamIds = (memberships ?? []).map((row) => row.team_id);
    const { data: publication, error: publicationError } = await supabase
      .from("job_publications")
      .select("id")
      .eq("company_id", profile.company_id)
      .eq("job_id", jobId)
      .in("team_id", teamIds.length ? teamIds : ["00000000-0000-0000-0000-000000000000"])
      .maybeSingle();
    if (publicationError) throw new Error(publicationError.message);
    if (!publication) throw new Error("Sin permiso para solicitar entrevista.");
  }

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("name,email")
    .eq("company_id", profile.company_id)
    .eq("id", candidateId)
    .single();
  if (candidateError) throw new Error(candidateError.message);

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("title")
    .eq("company_id", profile.company_id)
    .eq("id", jobId)
    .single();
  if (jobError) throw new Error(jobError.message);

  const { data: interviewer, error: interviewerError } = await supabase
    .from("profiles")
    .select("id,email,full_name")
    .eq("company_id", profile.company_id)
    .eq("id", interviewerId)
    .single();
  if (interviewerError) throw new Error(interviewerError.message);

  const connection = await getCalendarConnection(interviewerId, profile.company_id);
  if (!connection?.encrypted_refresh_token) throw new Error("Usuario no conectó Google Calendar.");
  if (!connection.availability_rules_json || !Object.keys(connection.availability_rules_json).length) throw new Error("No hay disponibilidad configurada.");

  const token = createToken();
  const tokenHash = hashToken(token);
  const expiresAt = addHours(new Date(), expiresHours);
  const bookingLink = `${getAppUrl()}/book/${token}`;

  await supabase.from("candidates").update({ email: candidateEmail }).eq("id", candidateId);
  const { data: request, error: requestError } = await supabase
    .from("interview_requests")
    .insert({
      company_id: profile.company_id,
      candidate_id: candidateId,
      job_id: jobId,
      requested_by_user_id: profile.id,
      interviewer_user_id: interviewerId,
      duration_minutes: durationMinutes,
      interview_type: interviewType,
      message,
      booking_token_hash: tokenHash,
      status: "created",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();
  if (requestError) throw new Error(requestError.message);

  const subject = `Invitación a entrevista - ${job.title}`;
  const body = invitationEmail({
    candidateName: candidate.name,
    jobTitle: job.title,
    interviewerName: interviewer.full_name,
    durationMinutes,
    bookingLink,
    expiresAt: expiresAt.toLocaleString("es-CL"),
  });

  try {
    const messageId = await sendEmail({ to: candidateEmail, subject, text: body });
    await supabase
      .from("interview_requests")
      .update({ status: "email_sent", email_sent_at: new Date().toISOString() })
      .eq("id", request.id);
    await supabase.from("candidates").update({ status: "interview_requested" }).eq("id", candidateId);
    await supabase.from("email_logs").insert({
      company_id: profile.company_id,
      interview_request_id: request.id,
      to_email: candidateEmail,
      subject,
      provider: "resend",
      provider_message_id: messageId,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    await supabase.from("interview_requests").update({ status: "failed" }).eq("id", request.id);
    await supabase.from("email_logs").insert({
      company_id: profile.company_id,
      interview_request_id: request.id,
      to_email: candidateEmail,
      subject,
      provider: "resend",
      status: "failed",
      error_message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  await auditLog({
    companyId: profile.company_id,
    entityType: "interview_request",
    entityId: request.id,
    action: "request_interview",
    actorUserId: profile.id,
  });

  revalidatePath(`/recruiting/candidates/${candidateId}`);
}

export async function saveCalendarSettingsAction(formData: FormData) {
  const profile = await requireCurrentProfile();
  const supabase = getSupabaseAdmin();
  const rules = {
    ...defaultAvailabilityRules,
    timezone: text(formData, "timezone") || defaultAvailabilityRules.timezone,
    minimum_notice_hours: Number(text(formData, "minimum_notice_hours") || "12"),
    max_days_ahead: Number(text(formData, "max_days_ahead") || "14"),
    buffer_before_minutes: Number(text(formData, "buffer_before_minutes") || "10"),
    buffer_after_minutes: Number(text(formData, "buffer_after_minutes") || "10"),
    days: {
      monday: [{ start: text(formData, "monday_start") || "09:00", end: text(formData, "monday_end") || "12:00" }],
      tuesday: [{ start: text(formData, "tuesday_start") || "15:00", end: text(formData, "tuesday_end") || "18:00" }],
      wednesday: [{ start: text(formData, "wednesday_start") || "09:00", end: text(formData, "wednesday_end") || "12:00" }],
      thursday: [{ start: text(formData, "thursday_start") || "09:00", end: text(formData, "thursday_end") || "12:00" }],
    },
  };

  const existing = await getCalendarConnection(profile.id, profile.company_id);
  const payload = {
    company_id: profile.company_id,
    user_id: profile.id,
    google_email: existing?.google_email || profile.email,
    google_calendar_id: text(formData, "google_calendar_id") || existing?.google_calendar_id || "primary",
    encrypted_refresh_token: existing?.encrypted_refresh_token || null,
    availability_rules_json: rules,
  };

  const { error } = await supabase.from("calendar_connections").upsert(payload, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  await auditLog({
    companyId: profile.company_id,
    entityType: "calendar_connection",
    entityId: existing?.id,
    action: "update_availability",
    actorUserId: profile.id,
  });
  revalidatePath("/recruiting/settings/calendar");
}

export async function confirmBookingAction(formData: FormData) {
  await confirmBooking(text(formData, "token"), text(formData, "slot_start"));
  redirect(`/book/${text(formData, "token")}?scheduled=1`);
}
