import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function auditLog(input: {
  companyId: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  await supabase.from("audit_logs").insert({
    company_id: input.companyId,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    actor_user_id: input.actorUserId ?? null,
    metadata_json: input.metadata ?? {},
  });
}
