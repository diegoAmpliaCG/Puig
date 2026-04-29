import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { encryptText } from "@/lib/crypto";
import { getGoogleOAuthClient } from "@/lib/google/oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/recruiting/jobs?error=google_drive", request.url));

  const auth = getGoogleOAuthClient("drive");
  const { tokens } = await auth.getToken(code);
  if (!tokens.refresh_token) return NextResponse.redirect(new URL("/recruiting/jobs?error=no_refresh_token", request.url));

  const cookieStore = await cookies();
  cookieStore.set("google_drive_refresh_token", encryptText(tokens.refresh_token), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.redirect(new URL("/recruiting/jobs?drive=connected", request.url));
}
