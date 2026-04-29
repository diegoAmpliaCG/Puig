import { NextResponse } from "next/server";
import { getCalendarAuthUrl } from "@/lib/google/oauth";

export async function GET() {
  return NextResponse.redirect(getCalendarAuthUrl());
}
