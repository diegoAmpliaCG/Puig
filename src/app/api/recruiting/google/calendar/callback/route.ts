import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { encryptText } from "@/lib/crypto";
import { getGoogleOAuthClient } from "@/lib/google/oauth";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { defaultAvailabilityRules } from "@/lib/recruiting/constants";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/recruiting/settings/calendar?error=google", request.url));

  const profile = await requireCurrentProfile();
  const auth = getGoogleOAuthClient("calendar");
  const { tokens } = await auth.getToken(code);
  if (!tokens.refresh_token) return NextResponse.redirect(new URL("/recruiting/settings/calendar?error=no_refresh_token", request.url));

  auth.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth });
  const userInfo = await oauth2.userinfo.get();
  const email = userInfo.data.email || profile.email;

  await getSupabaseAdmin().from("calendar_connections").upsert(
    {
      company_id: profile.company_id,
      user_id: profile.id,
      google_email: email,
      google_calendar_id: "primary",
      encrypted_refresh_token: encryptText(tokens.refresh_token),
      availability_rules_json: defaultAvailabilityRules,
    },
    { onConflict: "user_id" },
  );

  return NextResponse.redirect(new URL("/recruiting/settings/calendar?calendar=connected", request.url));
}
