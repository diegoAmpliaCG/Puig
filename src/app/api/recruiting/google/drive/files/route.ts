import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decryptText } from "@/lib/crypto";
import { listDriveDocuments } from "@/lib/google/drive";

export const runtime = "nodejs";

export async function GET() {
  try {
    const token = (await cookies()).get("google_drive_refresh_token")?.value;
    if (!token) return NextResponse.json({ connected: false, files: [] });
    const files = await listDriveDocuments(decryptText(token));
    return NextResponse.json({ connected: true, files });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error Drive" }, { status: 400 });
  }
}
