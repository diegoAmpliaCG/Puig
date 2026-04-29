import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DEMO_ADMIN_ID } from "@/lib/recruiting/constants";
import type { Profile } from "@/lib/recruiting/types";

const USER_COOKIE = "recruiting_demo_user_id";

export async function getCurrentProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_COOKIE)?.value || DEMO_ADMIN_ID;
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("profiles")
    .select("id, company_id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (data) return data as Profile;

  const fallback = await supabase
    .from("profiles")
    .select("id, company_id, email, full_name, role")
    .in("role", ["admin", "gestor"])
    .limit(1)
    .maybeSingle();

  return (fallback.data as Profile | null) ?? null;
}

export async function requireCurrentProfile() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("No hay perfil demo. Ejecuta el seed de Supabase.");
  return profile;
}

export function canManage(profile: Profile) {
  return profile.role === "admin" || profile.role === "gestor";
}

export async function setCurrentProfileCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
