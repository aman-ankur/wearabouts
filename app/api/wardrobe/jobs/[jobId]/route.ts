import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";
import { createTimer, logWearaboutsTelemetry } from "@/src/features/wardrobe/real/prettifyTelemetry";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const timer = createTimer();
  try {
    const session = await requireAccountSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { jobId } = await params;
    const { repository } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
    logWearaboutsTelemetry("api.job_load.started", {
      jobId,
      sessionKind: "account",
      circleId: session.circleId,
      profileId: session.profileId,
    });
    const job = await repository.getPrettifyJob(jobId);

    if (!job) {
      logWearaboutsTelemetry("api.job_load.not_found", {
        jobId,
        sessionKind: "account",
        durationMs: timer.elapsedMs(),
      });
      return NextResponse.json({ error: "Processing job not found." }, { status: 404 });
    }

    logWearaboutsTelemetry("api.job_load.completed", {
      jobId,
      status: job.status,
      jobKind: job.jobKind,
      batchId: job.uploadBatchId,
      detectedGarmentId: job.detectedGarmentId,
      errorMessage: job.errorMessage,
      durationMs: timer.elapsedMs(),
    });
    return NextResponse.json({ job });
  } catch (error) {
    logWearaboutsTelemetry("api.job_load.failed", {
      durationMs: timer.elapsedMs(),
      error: error instanceof Error ? error.message : "Could not load processing job.",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load processing job." },
      { status: 500 },
    );
  }
}
