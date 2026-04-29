insert into public.companies (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Demo Company')
on conflict (id) do update set name = excluded.name;

insert into public.profiles (id, company_id, email, full_name, role)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'admin@demo.local', 'Admin Selección', 'admin'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'comercial@demo.local', 'Usuario Comercial', 'team_user')
on conflict (id) do update set
  company_id = excluded.company_id,
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role;

insert into public.teams (id, company_id, name)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'Comercial')
on conflict (id) do update set name = excluded.name;

insert into public.team_members (id, team_id, user_id)
values ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000102')
on conflict (team_id, user_id) do nothing;

insert into public.jobs (
  id,
  company_id,
  title,
  area,
  location,
  modality,
  seniority,
  description,
  job_description_text,
  status,
  created_by
)
values (
  '00000000-0000-4000-8000-000000000401',
  '00000000-0000-4000-8000-000000000001',
  'Account Executive',
  'Comercial',
  'Santiago',
  'hibrido',
  'Mid/Senior',
  'Ejecutivo comercial B2B para expansión regional.',
  'Responsable de prospectar cuentas B2B, gestionar pipeline, negociar contratos y coordinar handoff con Customer Success. Requisitos: 4+ años en ventas B2B SaaS o servicios, manejo CRM, prospección outbound, forecast y negociación. Deseable experiencia enterprise y venta consultiva.',
  'ranking_ready',
  '00000000-0000-4000-8000-000000000101'
)
on conflict (id) do update set title = excluded.title;

insert into public.candidates (id, company_id, job_id, name, email, phone, source, status)
values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000401', 'María Torres', 'maria.torres@example.com', '+56911111111', 'demo', 'ranked'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000401', 'Javier Rojas', 'javier.rojas@example.com', '+56922222222', 'demo', 'ranked'),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000401', 'Camila Fuentes', null, '+56933333333', 'demo', 'ranked')
on conflict (id) do update set name = excluded.name, email = excluded.email, status = excluded.status;

insert into public.candidate_evaluations (
  company_id,
  candidate_id,
  job_id,
  overall_score,
  recommendation,
  summary,
  strengths_json,
  risks_json,
  criteria_json,
  interview_questions_json,
  raw_llm_json,
  confidence_score
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000401',
    88,
    'advance',
    'Trayectoria fuerte en ventas B2B y gestión de pipeline.',
    '["Experiencia B2B SaaS","Manejo de CRM","Buen ajuste a venta consultiva"]'::jsonb,
    '["Validar experiencia enterprise"]'::jsonb,
    '[{"name":"Experiencia relevante","score":90,"weight":20,"evidence":"Ha vendido soluciones B2B por más de 5 años."},{"name":"Fit responsabilidades","score":86,"weight":20,"evidence":"Describe prospección, negociación y forecast."}]'::jsonb,
    '["Cuéntanos un ciclo de venta complejo que hayas cerrado.","¿Cómo construyes forecast mensual?"]'::jsonb,
    '{}'::jsonb,
    82
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000502',
    '00000000-0000-4000-8000-000000000401',
    73,
    'review',
    'Buen perfil comercial, con brechas en SaaS.',
    '["Prospección outbound","Negociación"]'::jsonb,
    '["No evidencia CRM avanzado","Menor exposición SaaS"]'::jsonb,
    '[{"name":"Experiencia relevante","score":72,"weight":20,"evidence":"Ventas B2B en servicios profesionales."}]'::jsonb,
    '["¿Qué CRM has usado y cómo medías pipeline?"]'::jsonb,
    '{}'::jsonb,
    76
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000503',
    '00000000-0000-4000-8000-000000000401',
    59,
    'review',
    'Potencial comercial, pero falta evidencia clave.',
    '["Comunicación clara","Experiencia en cuentas pequeñas"]'::jsonb,
    '["No se detectó email","No acredita 4+ años B2B"]'::jsonb,
    '[{"name":"Requisitos obligatorios","score":48,"weight":25,"evidence":"No hay evidencia suficiente de experiencia B2B SaaS."}]'::jsonb,
    '["¿Puedes detallar tu experiencia con cuentas B2B?"]'::jsonb,
    '{}'::jsonb,
    65
  )
on conflict (candidate_id, job_id) do update set
  overall_score = excluded.overall_score,
  recommendation = excluded.recommendation,
  summary = excluded.summary,
  strengths_json = excluded.strengths_json,
  risks_json = excluded.risks_json,
  criteria_json = excluded.criteria_json,
  interview_questions_json = excluded.interview_questions_json,
  confidence_score = excluded.confidence_score;
