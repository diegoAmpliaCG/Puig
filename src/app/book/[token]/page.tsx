import { CheckCircle2 } from "lucide-react";
import { confirmBookingAction } from "@/app/recruiting/actions";
import { Card, CardHeader, SubmitButton } from "@/components/recruiting/ui";
import { getBookingData } from "@/lib/recruiting/booking";

export default async function BookingPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { token } = await params;
  const query = await searchParams;

  if (query.scheduled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] p-5">
        <Card className="max-w-lg">
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={42} />
            <h1 className="mt-4 text-xl font-semibold text-slate-950">Entrevista confirmada</h1>
            <p className="mt-2 text-sm text-slate-600">El evento fue enviado al calendario.</p>
          </div>
        </Card>
      </main>
    );
  }

  const data = await getBookingData(token);

  return (
    <main className="min-h-screen bg-[#f6f7f9] p-5">
      <div className="mx-auto max-w-3xl py-10">
        {"error" in data ? (
          <Card>
            <div className="p-8 text-center">
              <h1 className="text-xl font-semibold text-slate-950">No disponible</h1>
              <p className="mt-2 text-sm text-slate-600">{data.error}</p>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Agenda tu entrevista" subtitle="Selecciona un horario disponible." />
            <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-3">
              <div><p className="text-xs uppercase text-slate-500">Cargo</p><p className="mt-1 text-sm font-medium">{data.request.jobs.title}</p></div>
              <div><p className="text-xs uppercase text-slate-500">Entrevistador</p><p className="mt-1 text-sm font-medium">{data.request.profiles.full_name}</p></div>
              <div><p className="text-xs uppercase text-slate-500">Duración</p><p className="mt-1 text-sm font-medium">{data.request.duration_minutes} minutos</p></div>
            </div>
            <form action={confirmBookingAction} className="grid gap-3 p-5">
              <input type="hidden" name="token" value={token} />
              <div className="grid gap-2 sm:grid-cols-2">
                {data.slots.map((slot) => (
                  <label key={slot.start} className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50">
                    <input required type="radio" name="slot_start" value={slot.start} />
                    {slot.label}
                  </label>
                ))}
              </div>
              <div className="pt-2"><SubmitButton>Confirmar horario</SubmitButton></div>
            </form>
          </Card>
        )}
      </div>
    </main>
  );
}
