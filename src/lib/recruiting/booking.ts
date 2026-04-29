import { formatInTimeZone } from "date-fns-tz";
import { hashToken } from "@/lib/crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { auditLog } from "@/lib/recruiting/audit";
import { calculateAvailableSlots, createCalendarEvent } from "@/lib/google/calendar";
import { confirmationEmail, sendEmail } from "@/lib/recruiting/email";
import type { CalendarConnection, Candidate, InterviewRequest, Job, Profile } from "@/lib/recruiting/types";

export async function getBookingData(token: string) {
  const tokenHash = hashToken(token);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interview_requests")
    .select("*, candidates(*), jobs(*), profiles!interview_requests_interviewer_user_id_fkey(*)")
    .eq("booking_token_hash", tokenHash)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { error: "Link inválido." };

  const request = data as InterviewRequest & {
    candidates: Candidate;
    jobs: Job;
    profiles: Profile;
  };

  if (new Date(request.expires_at) < new Date()) {
    await supabase.from("interview_requests").update({ status: "expired" }).eq("id", request.id);
    return { error: "Link vencido." };
  }

  if (request.status === "scheduled") return { error: "Link ya usado." };

  if (!request.booking_opened_at) {
    await supabase
      .from("interview_requests")
      .update({ status: "booking_opened", booking_opened_at: new Date().toISOString() })
      .eq("id", request.id);
    await supabase.from("candidates").update({ status: "booking_opened" }).eq("id", request.candidate_id);
    await auditLog({
      companyId: request.company_id,
      entityType: "interview_request",
      entityId: request.id,
      action: "booking_opened",
      metadata: {},
    });
  }

  const connectionResult = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("company_id", request.company_id)
    .eq("user_id", request.interviewer_user_id)
    .maybeSingle();
  if (connectionResult.error) throw new Error(connectionResult.error.message);
  if (!connectionResult.data) return { error: "El entrevistador no tiene calendario conectado." };

  const connection = connectionResult.data as CalendarConnection;
  const slots = await calculateAvailableSlots(connection, request.duration_minutes);
  if (!slots.length) return { error: "No hay horarios disponibles." };

  return { request, slots };
}

export async function confirmBooking(token: string, slotStart: string) {
  const booking = await getBookingData(token);
  if ("error" in booking) throw new Error(booking.error);

  const { request } = booking;
  const selectedSlot = booking.slots.find((slot) => slot.start === slotStart);
  if (!selectedSlot) throw new Error("Horario no disponible.");

  const supabase = getSupabaseAdmin();
  const connectionResult = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("company_id", request.company_id)
    .eq("user_id", request.interviewer_user_id)
    .single();
  if (connectionResult.error) throw new Error(connectionResult.error.message);

  const connection = connectionResult.data as CalendarConnection;
  const freshSlots = await calculateAvailableSlots(connection, request.duration_minutes);
  if (!freshSlots.some((slot) => slot.start === slotStart)) throw new Error("Ese horario ya no está disponible.");

  if (!request.candidates.email) throw new Error("El candidato no tiene email.");

  const event = await createCalendarEvent({
    connection,
    candidateEmail: request.candidates.email,
    candidateName: request.candidates.name,
    interviewerEmail: request.profiles.email,
    jobTitle: request.jobs.title,
    start: slotStart,
    durationMinutes: request.duration_minutes,
  });

  await supabase
    .from("interview_requests")
    .update({
      status: "scheduled",
      scheduled_at: slotStart,
      calendar_event_id: event.eventId,
      google_meet_url: event.meetUrl,
    })
    .eq("id", request.id);
  await supabase.from("candidates").update({ status: "scheduled" }).eq("id", request.candidate_id);

  const timezone = connection.availability_rules_json?.timezone || "America/Santiago";
  const subject = `Entrevista confirmada - ${request.jobs.title}`;
  const text = confirmationEmail({
    candidateName: request.candidates.name,
    jobTitle: request.jobs.title,
    interviewerName: request.profiles.full_name,
    date: formatInTimeZone(slotStart, timezone, "dd-MM-yyyy"),
    time: formatInTimeZone(slotStart, timezone, "HH:mm"),
    durationMinutes: request.duration_minutes,
  });

  try {
    const messageId = await sendEmail({ to: request.candidates.email, subject, text });
    await supabase.from("email_logs").insert({
      company_id: request.company_id,
      interview_request_id: request.id,
      to_email: request.candidates.email,
      subject,
      provider: "resend",
      provider_message_id: messageId,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    await supabase.from("email_logs").insert({
      company_id: request.company_id,
      interview_request_id: request.id,
      to_email: request.candidates.email,
      subject,
      provider: "resend",
      status: "failed",
      error_message: error instanceof Error ? error.message : String(error),
    });
  }

  await auditLog({
    companyId: request.company_id,
    entityType: "interview_request",
    entityId: request.id,
    action: "confirm_interview",
    metadata: { calendar_event_id: event.eventId },
  });

  return event;
}
