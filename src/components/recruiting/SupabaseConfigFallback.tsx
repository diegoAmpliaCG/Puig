import { ConfigPending } from "@/components/recruiting/ConfigPending";
import { getMissingSupabaseEnv } from "@/lib/env";

export function getSupabaseConfigFallback() {
  const missing = getMissingSupabaseEnv();
  return missing.length ? <ConfigPending missing={missing} /> : null;
}
