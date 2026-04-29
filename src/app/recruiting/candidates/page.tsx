import Link from "next/link";
import { Badge, Card, CardHeader } from "@/components/recruiting/ui";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { listJobs, getCandidatesForJob, evaluationFor } from "@/lib/recruiting/db";

export default async function CandidatesPage() {
  const profile = await requireCurrentProfile();
  const jobs = await listJobs(profile);
  const nested = await Promise.all(jobs.map((job) => getCandidatesForJob(job.id, profile.company_id)));
  const candidates = nested.flat();

  return (
    <Card>
      <CardHeader title="Candidatos" subtitle={`${candidates.length} registros`} />
      <div className="divide-y divide-slate-100">
        {candidates.map((candidate) => {
          const evaluation = evaluationFor(candidate);
          return (
            <Link key={candidate.id} href={`/recruiting/candidates/${candidate.id}`} className="grid gap-2 px-5 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_120px_140px]">
              <div>
                <p className="font-medium text-slate-950">{candidate.name}</p>
                <p className="text-sm text-slate-500">{candidate.email || "Sin email"}</p>
              </div>
              <p className="text-sm font-medium">{evaluation ? Number(evaluation.overall_score).toFixed(0) : "Pendiente"}</p>
              <Badge value={candidate.status} />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
