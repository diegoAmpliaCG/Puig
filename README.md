# Recruiting MVP

Maqueta Next.js para evaluar CVs contra Job Descriptions, publicar rankings y coordinar entrevistas con Google Calendar.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Supabase DB + Storage privado + RLS
- OpenAI Responses API
- Google Drive API
- Google Calendar API + Meet
- Resend

## Setup

1. Copiar variables:

```bash
cp .env.example .env.local
```

2. Completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_APP_URL=
ENCRYPTION_SECRET=
```

3. Aplicar Supabase:

```bash
supabase db push
supabase db execute --file supabase/seed/001_demo.sql
```

Si usas dashboard: ejecutar `supabase/migrations/20260428180000_recruiting_mvp.sql` y luego `supabase/seed/001_demo.sql`.

## Buckets

La migración crea buckets privados:

- `candidate-cvs`
- `job-descriptions`

Rutas:

- `candidate-cvs/{company_id}/{job_id}/{candidate_id}/original.pdf`
- `job-descriptions/{company_id}/{job_id}/job-description.pdf`

## OAuth Google

Configurar redirect URIs:

- `${NEXT_PUBLIC_APP_URL}/api/recruiting/google/drive/callback`
- `${NEXT_PUBLIC_APP_URL}/api/recruiting/google/calendar/callback`

Scopes usados:

- Drive readonly
- Calendar
- Calendar events
- userinfo.email

## Rutas

- `/recruiting/jobs`
- `/recruiting/jobs/new`
- `/recruiting/jobs/[jobId]`
- `/recruiting/jobs/[jobId]/ranking`
- `/recruiting/candidates`
- `/recruiting/candidates/[candidateId]`
- `/recruiting/team/jobs`
- `/recruiting/interviews`
- `/recruiting/settings/calendar`
- `/book/[token]`

## Flujo demo

1. Entrar a `/recruiting/jobs`.
2. Crear cargo.
3. Pegar o subir JD.
4. Subir CVs o importar desde Drive.
5. Procesar ranking.
6. Publicar a Comercial.
7. Cambiar usuario a `Usuario Comercial`.
8. Revisar ranking y candidato.
9. Solicitar entrevista.
10. Candidato abre `/book/[token]`.
11. Elige horario.
12. Se crea evento Google Calendar con Meet.

## Checklist manual

- Variables Vercel configuradas.
- Migración aplicada.
- Seed opcional aplicado.
- OAuth Google con redirects correctos.
- Resend con dominio/remitente verificado.
- `NEXT_PUBLIC_APP_URL` apuntando a URL pública.
- `ENCRYPTION_SECRET` fuerte y estable.
