import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/recruiting/auth";
import { processJob } from "@/lib/recruiting/process";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const profile = await requireCurrentProfile();
    if (profile.role !== "admin" && profile.role !== "gestor") {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }
    const { jobId } = await params;
    const result = await processJob(jobId, profile.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error procesando" }, { status: 400 });
  }
}
