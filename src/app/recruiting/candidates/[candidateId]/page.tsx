import { requestInterviewAction } from "@/app/recruiting/actions";
import { Badge, Card, CardHeader, Field, SubmitButton, inputClass, textareaClass } from "@/components/recruiting/ui";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { auditLog } from "@/lib/recruiting/audit";
import { createSignedUrl } from "@/lib/recruiting/storage";
import { getCandidate, listProfiles } from "@/lib/recruiting/db";

export default async function CandidatePage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  const profile = await requireCurrentProfile();
  const candidate = await getCandidate(candidateId, profile);
  if (!candidate) throw new Error("Candidato no encontrado");
  const evaluation = candidate.candidate_evaluations?.[0];
  const file = candidate.candidate_files?.[0];
  const cvUrl = file ? await createSignedUrl("candidate-cvs", file.storage_path) : null;
  const profiles = await listProfiles(profile.company_id);

  await auditLog({
    companyId: profile.company_id,
    entityType: "candidate",
    entityId: candidate.id,
    action: "view_candidate",
    actorUserId: profile.id,
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Card>
          <CardHeader title={candidate.name} subtitle={candidate.jobs.title} action={<Badge value={candidate.status} />} />
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div><p className="text-xs uppercase text-slate-500">Email</p><p className="mt-1 text-sm font-medium">{candidate.email || "No detectado"}</p></div>
            <div><p className="text-xs uppercase text-slate-500">Teléfono</p><p className="mt-1 text-sm font-medium">{candidate.phone || "No detectado"}</p></div>
            <div><p className="text-xs uppercase text-slate-500">Score</p><p className="mt-1 text-sm font-medium">{evaluation ? Number(evaluation.overall_score).toFixed(0) : "Pendiente"}</p></div>
          </div>
          {!candidate.email ? <div className="mx-5 mb-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No se detectó email del candidato. Ingresa un email manualmente para enviar la invitación.</div> : null}
        </Card>

        <Card>
          <CardHeader title="Evaluación LLM" action={evaluation ? <Badge value={evaluation.recommendation} /> : null} />
          {evaluation ? (
            <div className="space-y-5 p-5">
              <p className="text-sm leading-6 text-slate-700">{evaluation.summary}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">Fortalezas</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">{evaluation.strengths_json.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Riesgos / brechas</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">{evaluation.risks_json.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Criterios</h3>
                <div className="mt-2 grid gap-2">
                  {evaluation.criteria_json.map((criterion) => (
                    <div key={criterion.name} className="rounded-md border border-slate-200 p-3">
                      <div className="flex justify-between gap-3 text-sm font-medium">
                        <span>{criterion.name}</span>
                        <span>{criterion.score}/100 · peso {criterion.weight}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{criterion.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Preguntas sugeridas</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">{evaluation.interview_questions_json.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          ) : <p className="p-5 text-sm text-slate-500">Sin evaluación.</p>}
        </Card>
      </div>

      <aside className="space-y-5">
        <Card>
          <CardHeader title="CV original" />
          <div className="p-5">
            {cvUrl ? <a href={cvUrl} target="_blank" className="font-medium text-[#2457a6]">Ver archivo privado</a> : <p className="text-sm text-slate-500">Sin archivo.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Solicitar entrevista" subtitle="Envía link único por email." />
          <form action={requestInterviewAction} className="grid gap-4 p-5">
            <input type="hidden" name="candidate_id" value={candidate.id} />
            <input type="hidden" name="job_id" value={candidate.job_id} />
            <Field label="Email candidato"><input name="candidate_email" defaultValue={candidate.email || ""} required className={inputClass} /></Field>
            <Field label="Entrevistador">
              <select name="interviewer_user_id" defaultValue={profile.id} className={inputClass}>
                {profiles.map((user) => <option key={user.id} value={user.id}>{user.full_name}</option>)}
              </select>
            </Field>
            <Field label="Duración">
              <select name="duration_minutes" className={inputClass}>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </Field>
            <Field label="Tipo">
              <select name="interview_type" className={inputClass}>
                <option value="screening">Screening</option>
                <option value="tecnica">Técnica</option>
                <option value="cultural">Cultural</option>
                <option value="final">Final</option>
              </select>
            </Field>
            <Field label="Mensaje"><textarea name="message" className={textareaClass} defaultValue="Hola, nos gustaría coordinar una entrevista." /></Field>
            <Field label="Vence en horas"><input name="expires_hours" type="number" defaultValue={72} className={inputClass} /></Field>
            <SubmitButton>Enviar invitación</SubmitButton>
          </form>
        </Card>
      </aside>
    </div>
  );
}
