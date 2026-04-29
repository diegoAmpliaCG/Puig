import crypto from "node:crypto";
import { addDays, addHours, addMinutes, isAfter, isBefore } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { google } from "googleapis";
import { decryptText } from "@/lib/crypto";
import { getGoogleOAuthClient } from "@/lib/google/oauth";
import { defaultAvailabilityRules } from "@/lib/recruiting/constants";
import type { AvailabilityRules, CalendarConnection } from "@/lib/recruiting/types";

type BusyRange = { start?: string | null; end?: string | null };
export type Slot = { start: string; end: string; label: string };

function calendarClient(connection: CalendarConnection) {
  if (!connection.encrypted_refresh_token) throw new Error("El entrevistador no conectó Google Calendar.");
  const auth = getGoogleOAuthClient("calendar");
  auth.setCredentials({ refresh_token: decryptText(connection.encrypted_refresh_token) });
  return google.calendar({ version: "v3", auth });
}

export function normalizeRules(raw: unknown): AvailabilityRules {
  const value = raw as Partial<AvailabilityRules> | null;
  return {
    ...defaultAvailabilityRules,
    ...(value ?? {}),
    days: {
      ...defaultAvailabilityRules.days,
      ...(value?.days ?? {}),
    },
  };
}

export async function getFreeBusy(connection: CalendarConnection, timeMin: Date, timeMax: Date) {
  const calendar = calendarClient(connection);
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: connection.google_calendar_id || "primary" }],
    },
  });

  return response.data.calendars?.[connection.google_calendar_id || "primary"]?.busy ?? [];
}

function overlaps(slotStart: Date, slotEnd: Date, busy: BusyRange[], before: number, after: number) {
  return busy.some((range) => {
    if (!range.start || !range.end) return false;
    const busyStart = addMinutes(new Date(range.start), -before);
    const busyEnd = addMinutes(new Date(range.end), after);
    return isBefore(slotStart, busyEnd) && isAfter(slotEnd, busyStart);
  });
}

export async function calculateAvailableSlots(connection: CalendarConnection, durationMinutes: number) {
  const rules = normalizeRules(connection.availability_rules_json);
  const now = new Date();
  const minStart = addHours(now, rules.minimum_notice_hours);
  const maxEnd = addDays(now, rules.max_days_ahead);
  const busy = await getFreeBusy(connection, minStart, maxEnd);
  const slots: Slot[] = [];

  for (let day = 0; day <= rules.max_days_ahead; day += 1) {
    const dayDate = addDays(now, day);
    const dayKey = formatInTimeZone(dayDate, rules.timezone, "eeee").toLowerCase();
    const ranges = rules.days[dayKey] ?? [];
    const dateKey = formatInTimeZone(dayDate, rules.timezone, "yyyy-MM-dd");

    for (const range of ranges) {
      let start = fromZonedTime(`${dateKey}T${range.start}:00`, rules.timezone);
      const rangeEnd = fromZonedTime(`${dateKey}T${range.end}:00`, rules.timezone);

      while (!isAfter(addMinutes(start, durationMinutes), rangeEnd)) {
        const end = addMinutes(start, durationMinutes);
        if (isAfter(start, minStart) && !overlaps(start, end, busy, rules.buffer_before_minutes, rules.buffer_after_minutes)) {
          slots.push({
            start: start.toISOString(),
            end: end.toISOString(),
            label: formatInTimeZone(start, rules.timezone, "EEE dd MMM, HH:mm"),
          });
        }
        start = addMinutes(start, durationMinutes);
      }
    }
  }

  return slots.slice(0, 24);
}

export async function createCalendarEvent(input: {
  connection: CalendarConnection;
  candidateEmail: string;
  candidateName: string;
  interviewerEmail: string;
  jobTitle: string;
  start: string;
  durationMinutes: number;
}) {
  const calendar = calendarClient(input.connection);
  const start = new Date(input.start);
  const end = addMinutes(start, input.durationMinutes);
  const requestId = `recruiting-${crypto.randomUUID()}`;

  const response = await calendar.events.insert({
    calendarId: input.connection.google_calendar_id || "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: `Entrevista - ${input.jobTitle} - ${input.candidateName}`,
      description: "Entrevista coordinada desde Recruiting MVP.",
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [
        { email: input.candidateEmail, displayName: input.candidateName },
        { email: input.interviewerEmail },
      ],
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  return {
    eventId: response.data.id || "",
    meetUrl: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri || "",
  };
}
