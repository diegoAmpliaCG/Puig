import Link from "next/link";
import { getSupabaseConfigFallback } from "@/components/recruiting/SupabaseConfigFallback";
import { Badge, Card, CardHeader, EmptyState, Metric } from "@/components/recruiting/ui";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { getCandidatesForJob, getJob, evaluationFor } from "@/lib/recruiting/db";

export default async function RankingPage({ params, searchParams }: { params: Promise<{ jobId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const configFallback = getSupabaseConfigFallback();
  if (configFallback) return configFallback;

  const { jobId } = await params;
  const filters = await searchParams;
  const profile = await requireCurrentProfile();
  const job = await getJob(jobId, profile);
  if (!job) throw new Error("Cargo no encontrado");
  const rows = await getCandidatesForJob(jobId, profile.company_id);
  const minScore = Number(filters.min_score || 0);
  const recommendation = filters.recommendation || "";
  const q = (filters.q || "").toLowerCase();
  const ranked = rows
    .map((row) => ({ row, evaluation: evaluationFor(row) }))
    .filter(({ evaluation }) => evaluation)
    .filter(({ evaluation }) => !minScore || Number(evaluation?.overall_score || 0) >= minScore)
    .filter(({ evaluation }) => !recommendation || evaluation?.recommendation === recommendation)
    .filter(({ row, evaluation }) => !q || row.name.toLowerCase().includes(q) || evaluation?.summary.toLowerCase().includes(q))
    .sort((a, b) => Number(b.evaluation?.overall_score || 0) - Number(a.evaluation?.overall_score || 0));

  const processed = rows.filter((row) => evaluationFor(row)).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Ranking · {job.title}</h2>
        <p className="text-sm text-slate-500">Ordenado por score descendente.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Metric label="Estado" value={<Badge value={job.status} />} />
        <Metric label="CVs" value={rows.length} />
        <Metric label="Procesados" value={processed} />
        <Metric label="Errores" value={Math.max(rows.length - processed, 0)} />
      </div>

      <Card>
        <CardHeader title="Filtros" />
        <form className="grid gap-3 p-5 sm:grid-cols-4">
          <input name="min_score" type="number" placeholder="Score mínimo" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          <select name="recommendation" className="h-10 rounded-md border border-slate-300 px-3 text-sm">
            <option value="">Todas</option>
            <option value="advance">Avanzar</option>
            <option value="review">Revisar</option>
            <option value="reject">Descartar</option>
          </select>
          <input name="q" placeholder="Texto libre" className="h-10 rounded-md border border-slate-300 px-3 text-sm sm:col-span-2" />
        </form>
      </Card>

      <Card>
        <CardHeader title="Candidatos" subtitle={`${ranked.length} resultados`} />
        {ranked.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Ranking</th>
                  <th className="px-5 py-3">Candidato</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Recomendación</th>
                  <th className="px-5 py-3">Resumen</th>
                  <th className="px-5 py-3">Riesgo principal</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranked.map(({ row, evaluation }, index) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4 font-semibold">#{index + 1}</td>
                    <td className="px-5 py-4 font-medium text-slate-950">{row.name}</td>
                    <td className="px-5 py-4">{Number(evaluation?.overall_score).toFixed(0)}</td>
                    <td className="px-5 py-4"><Badge value={evaluation?.recommendation || "review"} /></td>
                    <td className="max-w-sm px-5 py-4 text-slate-600">{evaluation?.summary}</td>
                    <td className="max-w-xs px-5 py-4 text-slate-600">{evaluation?.risks_json?.[0] || "Sin riesgo principal"}</td>
                    <td className="px-5 py-4"><Badge value={row.status} /></td>
                    <td className="px-5 py-4"><Link className="font-medium text-[#2457a6]" href={`/recruiting/candidates/${row.id}`}>Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-5"><EmptyState title="Sin ranking" text="Procesa los CVs para generar resultados." /></div>}
      </Card>
    </div>
  );
}
