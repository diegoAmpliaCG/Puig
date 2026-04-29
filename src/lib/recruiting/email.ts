import { Resend } from "resend";
import { requireEnv } from "@/lib/env";

let resend: Resend | null = null;

function getResend() {
  if (!resend) resend = new Resend(requireEnv("RESEND_API_KEY"));
  return resend;
}

export async function sendEmail(input: { to: string; subject: string; text: string }) {
  const response = await getResend().emails.send({
    from: requireEnv("EMAIL_FROM"),
    to: input.to,
    subject: input.subject,
    text: input.text,
  });

  if (response.error) throw new Error(response.error.message);
  return response.data?.id ?? null;
}

export function invitationEmail(input: {
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  durationMinutes: number;
  bookingLink: string;
  expiresAt: string;
}) {
  return `Hola ${input.candidateName},

Queremos coordinar una entrevista para el cargo ${input.jobTitle}.

Entrevistador: ${input.interviewerName}
Duración: ${input.durationMinutes} minutos
Modalidad: Google Meet

Puedes elegir un horario disponible aquí:

${input.bookingLink}

Este link estará disponible hasta ${input.expiresAt}.

Saludos,
Equipo de selección`;
}

export function confirmationEmail(input: {
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  date: string;
  time: string;
  durationMinutes: number;
}) {
  return `Hola ${input.candidateName},

Tu entrevista fue confirmada.

Cargo: ${input.jobTitle}
Entrevistador: ${input.interviewerName}
Fecha: ${input.date}
Hora: ${input.time}
Duración: ${input.durationMinutes} minutos
Modalidad: Google Meet

El evento fue enviado a tu calendario.

Saludos,
Equipo de selección`;
}
