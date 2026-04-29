import Link from "next/link";
import { DriveImportPanel } from "@/components/recruiting/DriveImportPanel";
import { Badge, ButtonLink, Card, CardHeader, EmptyState, Field, Metric, SubmitButton, inputClass, textareaClass } from "@/components/recruiting/ui";
import { processJobAction, publishJobAction, uploadCandidateFilesAction, uploadJobDescriptionAction } from "@/app/recruiting/actions";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { getCandidatesForJob, getJobFiles, getManagedJob, listTeams } from "@/lib/recruiting/db";

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const profile = await requireCurrentProfile();
  const job = await getManagedJob(jobId, profile);
  const [files, candidates, teams] = await Promise.all([
    getJobFiles(jobId, profile.company_id),
    getCandidatesForJob(jobId, profile.company_id),
    listTeams(profile.company_id),
  ]);
  const jdFiles = files.filter((file) => file.file_role === "job_description");
  const processed = candidates.filter((candidate) => candidate.candidate_evaluations && Array.isArray(candidate.candidate_evaluations) && candidate.candidate_evaluations.length).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-950">{job.title}</h2>
            <Badge value={job.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{job.area} · {job.location} · {job.modality}</p>
        </div>
        <ButtonLink href={`/recruiting/jobs/${job.id}/ranking`} variant="secondary">Ver ranking</ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="CVs" value={candidates.length} />
        <Metric label="Procesados" value={processed} />
        <Metric label="JD" value={job.job_description_text || job.job_description_file_path ? "Listo" : "Pendiente"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Job Description" subtitle="Pegar, subir o elegir desde Drive." />
          <form action={uploadJobDescriptionAction} className="grid gap-4 p-5">
            <input type="hidden" name="job_id" value={job.id} />
            <Field label="Texto JD"><textarea name="job_description_text" defaultValue={job.job_description_text || ""} className={textareaClass} /></Field>
            <Field label="Archivo JD"><input name="job_description_file" type="file" accept=".pdf,.doc,.docx,.txt" className={inputClass} /></Field>
            <SubmitButton>Guardar JD</SubmitButton>
          </form>
          <div className="border-t border-slate-200 p-5">
            <DriveImportPanel jobId={job.id} />
          </div>
          <div className="border-t border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-700">Archivos JD</p>
            {jdFiles.length ? (
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                {jdFiles.map((file) => <li key={file.id}>{file.file_name}</li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-slate-500">Sin archivo.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="CVs" subtitle="Carga manual como fallback funcional." />
          <form action={uploadCandidateFilesAction} className="grid gap-4 p-5">
            <input type="hidden" name="job_id" value={job.id} />
            <Field label="Archivos CV"><input required multiple name="candidate_files" type="file" accept=".pdf,.doc,.docx,.txt" className={inputClass} /></Field>
            <SubmitButton>Subir CVs</SubmitButton>
          </form>
          <div className="border-t border-slate-200 p-5">
            {candidates.length ? (
              <div className="grid gap-2">
                {candidates.map((candidate) => (
                  <Link key={candidate.id} href={`/recruiting/candidates/${candidate.id}`} className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                    {candidate.name}
                  </Link>
                ))}
              </div>
            ) : <EmptyState title="Sin CVs" text="Sube CVs o impórtalos desde Drive." />}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Acciones" subtitle="Procesar ranking y publicar a equipos." />
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <form action={processJobAction} className="rounded-lg border border-slate-200 p-4">
            <input type="hidden" name="job_id" value={job.id} />
            <p className="text-sm text-slate-600">OpenAI compara cada CV contra el JD y genera el ranking.</p>
            <div className="mt-4"><SubmitButton>Procesar ranking</SubmitButton></div>
          </form>
          <form action={publishJobAction} className="rounded-lg border border-slate-200 p-4">
            <input type="hidden" name="job_id" value={job.id} />
            <p className="text-sm font-medium text-slate-700">Publicar ranking</p>
            <div className="mt-3 grid gap-2">
              {teams.map((team) => (
                <label key={team.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="team_ids" value={team.id} />
                  {team.name}
                </label>
              ))}
            </div>
            <div className="mt-4"><SubmitButton variant="secondary">Publicar</SubmitButton></div>
          </form>
        </div>
      </Card>
    </div>
  );
}
