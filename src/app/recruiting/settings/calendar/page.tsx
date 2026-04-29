import { saveCalendarSettingsAction } from "@/app/recruiting/actions";
import { getSupabaseConfigFallback } from "@/components/recruiting/SupabaseConfigFallback";
import { Card, CardHeader, Field, SubmitButton, inputClass } from "@/components/recruiting/ui";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { getCalendarConnection } from "@/lib/recruiting/db";
import { normalizeRules } from "@/lib/google/calendar";

export default async function CalendarSettingsPage() {
  const configFallback = getSupabaseConfigFallback();
  if (configFallback) return configFallback;

  const profile = await requireCurrentProfile();
  const connection = await getCalendarConnection(profile.id, profile.company_id);
  const rules = normalizeRules(connection?.availability_rules_json);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Card>
        <CardHeader title="Google Calendar" subtitle={connection?.encrypted_refresh_token ? `Conectado: ${connection.google_email}` : "No conectado"} />
        <div className="p-5">
          <a href="/api/recruiting/google/calendar/connect" className="inline-flex h-10 items-center rounded-md bg-[#2457a6] px-4 text-sm font-medium text-white">Conectar Google Calendar</a>
        </div>
      </Card>

      <Card>
        <CardHeader title="Reglas de disponibilidad" />
        <form action={saveCalendarSettingsAction} className="grid gap-4 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Zona horaria"><input name="timezone" defaultValue={rules.timezone} className={inputClass} /></Field>
            <Field label="Calendario"><input name="google_calendar_id" defaultValue={connection?.google_calendar_id || "primary"} className={inputClass} /></Field>
            <Field label="Anticipación mínima"><input name="minimum_notice_hours" type="number" defaultValue={rules.minimum_notice_hours} className={inputClass} /></Field>
            <Field label="Máx. días adelante"><input name="max_days_ahead" type="number" defaultValue={rules.max_days_ahead} className={inputClass} /></Field>
            <Field label="Buffer antes"><input name="buffer_before_minutes" type="number" defaultValue={rules.buffer_before_minutes} className={inputClass} /></Field>
            <Field label="Buffer después"><input name="buffer_after_minutes" type="number" defaultValue={rules.buffer_after_minutes} className={inputClass} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["monday", "tuesday", "wednesday", "thursday"].map((day) => (
              <div key={day} className="rounded-lg border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold capitalize">{day}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Inicio"><input name={`${day}_start`} type="time" defaultValue={rules.days[day]?.[0]?.start || "09:00"} className={inputClass} /></Field>
                  <Field label="Fin"><input name={`${day}_end`} type="time" defaultValue={rules.days[day]?.[0]?.end || "12:00"} className={inputClass} /></Field>
                </div>
              </div>
            ))}
          </div>
          <SubmitButton>Guardar disponibilidad</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
