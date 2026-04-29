import { getSupabaseConfigFallback } from "@/components/recruiting/SupabaseConfigFallback";
import { Badge, Card, CardHeader, EmptyState } from "@/components/recruiting/ui";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { listInterviewRequests } from "@/lib/recruiting/db";

export default async function InterviewsPage() {
  const configFallback = getSupabaseConfigFallback();
  if (configFallback) return configFallback;

  const profile = await requireCurrentProfile();
  const requests = await listInterviewRequests(profile.company_id);

  return (
    <Card>
      <CardHeader title="Entrevistas" subtitle={`${requests.length} solicitudes`} />
      {requests.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Candidato</th>
                <th className="px-5 py-3">Cargo</th>
                <th className="px-5 py-3">Entrevistador</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Meet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-5 py-4">{request.candidates.name}</td>
                  <td className="px-5 py-4">{request.jobs.title}</td>
                  <td className="px-5 py-4">{request.profiles.full_name}</td>
                  <td className="px-5 py-4"><Badge value={request.status} /></td>
                  <td className="px-5 py-4">{request.google_meet_url ? <a className="text-[#2457a6]" href={request.google_meet_url}>Abrir</a> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="p-5"><EmptyState title="Sin entrevistas" text="Las solicitudes aparecerán aquí." /></div>}
    </Card>
  );
}
