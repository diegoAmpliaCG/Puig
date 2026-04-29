import Link from "next/link";
import { Plus } from "lucide-react";
import { ButtonLink, Card, CardHeader, Badge, EmptyState } from "@/components/recruiting/ui";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { listJobs } from "@/lib/recruiting/db";

export default async function JobsPage() {
  const profile = await requireCurrentProfile();
  const jobs = await listJobs(profile);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Procesos</h2>
          <p className="text-sm text-slate-500">Cargos abiertos y rankings.</p>
        </div>
        <ButtonLink href="/recruiting/jobs/new"><Plus size={16} /> Nuevo cargo</ButtonLink>
      </div>

      <Card>
        <CardHeader title="Cargos" subtitle={`${jobs.length} procesos`} />
        {jobs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Cargo</th>
                  <th className="px-5 py-3">Área</th>
                  <th className="px-5 py-3">Ubicación</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-5 py-4 font-medium text-slate-950">{job.title}</td>
                    <td className="px-5 py-4 text-slate-600">{job.area}</td>
                    <td className="px-5 py-4 text-slate-600">{job.location}</td>
                    <td className="px-5 py-4"><Badge value={job.status} /></td>
                    <td className="px-5 py-4"><Link className="font-medium text-[#2457a6]" href={`/recruiting/jobs/${job.id}`}>Abrir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5"><EmptyState title="Sin cargos" text="Crea un cargo para iniciar el flujo." /></div>
        )}
      </Card>
    </div>
  );
}
