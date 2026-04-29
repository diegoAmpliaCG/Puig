import { google } from "googleapis";
import { getAppUrl, requireEnv } from "@/lib/env";

export function getGoogleOAuthClient(kind: "drive" | "calendar") {
  const configured = process.env.GOOGLE_REDIRECT_URI;
  const redirectUri =
    configured ||
    `${getAppUrl()}/api/recruiting/google/${kind}/callback`;

  return new google.auth.OAuth2(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri,
  );
}

export function getDriveAuthUrl() {
  return getGoogleOAuthClient("drive").generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
}

export function getCalendarAuthUrl() {
  return getGoogleOAuthClient("calendar").generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
}
