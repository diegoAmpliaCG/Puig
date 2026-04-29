import { createJobAction } from "@/app/recruiting/actions";
import { getSupabaseConfigFallback } from "@/components/recruiting/SupabaseConfigFallback";
import { Card, CardHeader, Field, SubmitButton, inputClass, textareaClass } from "@/components/recruiting/ui";

export default function NewJobPage() {
  const configFallback = getSupabaseConfigFallback();
  if (configFallback) return configFallback;

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader title="Nuevo cargo" subtitle="Datos mínimos del proceso." />
        <form action={createJobAction} className="grid gap-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del cargo"><input name="title" required className={inputClass} /></Field>
            <Field label="Área"><input name="area" required className={inputClass} /></Field>
            <Field label="Ubicación"><input name="location" required className={inputClass} /></Field>
            <Field label="Modalidad">
              <select name="modality" required className={inputClass}>
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </Field>
            <Field label="Seniority"><input name="seniority" required className={inputClass} /></Field>
          </div>
          <Field label="Descripción corta"><textarea name="description" required className={textareaClass} /></Field>
          <Field label="Job Description pegado"><textarea name="job_description_text" className={textareaClass} /></Field>
          <div className="flex justify-end"><SubmitButton>Crear cargo</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}
