import { NextResponse } from "next/server";
import { getDriveAuthUrl } from "@/lib/google/oauth";

export async function GET() {
  return NextResponse.redirect(getDriveAuthUrl());
}
