import type { AvailabilityRules } from "@/lib/recruiting/types";

export const DEMO_ADMIN_ID = "00000000-0000-4000-8000-000000000101";
export const DEMO_TEAM_USER_ID = "00000000-0000-4000-8000-000000000102";
export const DEMO_COMPANY_ID = "00000000-0000-4000-8000-000000000001";

export const defaultAvailabilityRules: AvailabilityRules = {
  timezone: "America/Santiago",
  days: {
    monday: [{ start: "09:00", end: "12:00" }],
    tuesday: [{ start: "15:00", end: "18:00" }],
    wednesday: [{ start: "09:00", end: "12:00" }],
    thursday: [{ start: "09:00", end: "12:00" }],
  },
  buffer_before_minutes: 10,
  buffer_after_minutes: 10,
  minimum_notice_hours: 12,
  max_days_ahead: 14,
};

export const jobStatusLabels: Record<string, string> = {
  draft: "Borrador",
  cv_selection: "CVs",
  processing: "Procesando",
  ranking_ready: "Ranking listo",
  published: "Publicado",
  closed: "Cerrado",
};

export const candidateStatusLabels: Record<string, string> = {
  selected: "Seleccionado",
  processing: "Procesando",
  ranked: "Rankeado",
  published: "Publicado",
  viewed_by_team: "Visto",
  interview_requested: "Entrevista solicitada",
  booking_opened: "Link abierto",
  scheduled: "Agendada",
  interview_done: "Realizada",
  advanced: "Avanza",
  rejected: "Rechazado",
};

export const recommendationLabels: Record<string, string> = {
  advance: "Avanzar",
  review: "Revisar",
  reject: "Descartar",
};
