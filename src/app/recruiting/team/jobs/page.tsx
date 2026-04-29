import Link from "next/link";
import { getSupabaseConfigFallback } from "@/components/recruiting/SupabaseConfigFallback";
import { Badge, Card, CardHeader, EmptyState } from "@/components/recruiting/ui";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { listJobs } from "@/lib/recruiting/db";

export default async function TeamJobsPage() {
  const configFallback = getSupabaseConfigFallback();
  if (configFallback) return configFallback;

  const profile = await requireCurrentProfile();
  const jobs = await listJobs(profile);

  return (
    <Card>
      <CardHeader title="Cargos publicados" subtitle="Vista usuario interno." />
      {jobs.length ? (
        <div className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <Link key={job.id} href={`/recruiting/jobs/${job.id}/ranking`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
              <div>
                <p className="font-medium text-slate-950">{job.title}</p>
                <p className="text-sm text-slate-500">{job.area} · {job.location}</p>
              </div>
              <Badge value={job.status} />
            </Link>
          ))}
        </div>
      ) : <div className="p-5"><EmptyState title="Sin cargos publicados" text="Cuando el gestor publique, aparecerán aquí." /></div>}
    </Card>
  );
}
