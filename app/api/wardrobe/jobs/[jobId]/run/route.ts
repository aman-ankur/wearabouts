import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";
import { createTimer, logWearaboutsTelemetry } from "@/src/features/wardrobe/real/prettifyTelemetry";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const timer = createTimer();
  try {
    const session = await requireAccountSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { jobId } = await params;
    const { pipeline } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
    logWearaboutsTelemetry("api.job_run.started", { jobId });
    const result = await pipeline.runPrettifyJob(jobId);

    logWearaboutsTelemetry("api.job_run.completed", {
      jobId,
      status: result.job.status,
      generatedGarmentCount: result.garments.length,
      durationMs: timer.elapsedMs(),
    });
    return NextResponse.json(result);
  } catch (error) {
    logWearaboutsTelemetry("api.job_run.failed", {
      durationMs: timer.elapsedMs(),
      error: error instanceof Error ? error.message : "Could not process photo.",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not process photo." },
      { status: 500 },
    );
  }
}
