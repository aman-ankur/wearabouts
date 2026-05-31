import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createDevCachedUpload } from "@/src/features/wardrobe/real/devCachedUpload";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";
import { createTimer, logWearaboutsTelemetry } from "@/src/features/wardrobe/real/prettifyTelemetry";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const timer = createTimer();
  try {
    const session = await requireAccountSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const formData = await request.formData();
    const file = formData.get("item_photo") ?? formData.get("file");
    const filename = file instanceof File ? file.name : "cached-dev-upload";
    const sourceType = formData.get("source_type") === "outfit_photo" ? "outfit_photo" : "item_photo";

    const { repository } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
    logWearaboutsTelemetry("api.dev_upload.started", {
      filename,
      sourceType,
      sessionKind: "account",
      circleId: session.circleId,
      profileId: session.profileId,
    });
    const result = await createDevCachedUpload(repository, { sourceType, uploadedFilename: filename });

    logWearaboutsTelemetry("api.dev_upload.completed", {
      batchId: result.batch.id,
      garmentCount: result.batch.detectedGarments.length,
      cachedFromWardrobeItemId: result.cachedFromWardrobeItemId,
      durationMs: timer.elapsedMs(),
    });
    return NextResponse.json({
      batchId: result.batch.id,
      garmentId: result.garment?.id,
      cachedFromWardrobeItemId: result.cachedFromWardrobeItemId,
    });
  } catch (error) {
    logWearaboutsTelemetry("api.dev_upload.failed", {
      durationMs: timer.elapsedMs(),
      error: error instanceof Error ? error.message : "Could not create cached dev upload.",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create cached dev upload." },
      { status: 500 },
    );
  }
}
