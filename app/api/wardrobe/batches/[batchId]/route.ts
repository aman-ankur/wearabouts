import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";
import { createTimer, logWearaboutsTelemetry } from "@/src/features/wardrobe/real/prettifyTelemetry";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const timer = createTimer();
  try {
    const session = await requireAccountSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { batchId } = await params;
    const { repository } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
    logWearaboutsTelemetry("api.batch_load.started", {
      batchId,
      sessionKind: "account",
      circleId: session.circleId,
      profileId: session.profileId,
    });
    const batch = await repository.getUploadBatchWithGarments(batchId);

    if (!batch) {
      logWearaboutsTelemetry("api.batch_load.not_found", {
        batchId,
        sessionKind: "account",
        circleId: session.circleId,
        profileId: session.profileId,
        durationMs: timer.elapsedMs(),
      });
      return NextResponse.json({ error: "Upload batch not found." }, { status: 404 });
    }

    logWearaboutsTelemetry("api.batch_load.completed", {
      batchId,
      sessionKind: "account",
      sourceType: batch.sourceType,
      garmentCount: batch.detectedGarments.length,
      candidateCount: batch.garmentCandidates?.length ?? 0,
      generatedCandidateCount: batch.candidateSummary?.generatedCount ?? 0,
      skippedCandidateCount: batch.candidateSummary?.skippedCount ?? 0,
      failedCandidateCount: batch.candidateSummary?.failedCount ?? 0,
      durationMs: timer.elapsedMs(),
    });
    return NextResponse.json({ batch });
  } catch (error) {
    logWearaboutsTelemetry("api.batch_load.failed", {
      durationMs: timer.elapsedMs(),
      error: error instanceof Error ? error.message : "Could not load upload batch.",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load upload batch." },
      { status: 500 },
    );
  }
}
