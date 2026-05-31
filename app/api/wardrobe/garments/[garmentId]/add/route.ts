import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";
import { createTimer, logWearaboutsTelemetry } from "@/src/features/wardrobe/real/prettifyTelemetry";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ garmentId: string }> }) {
  const timer = createTimer();
  try {
    const session = await requireAccountSession(request, { allowGuest: true });
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { garmentId } = await params;
    const { pipeline } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
    logWearaboutsTelemetry("api.garment_add.started", {
      garmentId,
      sessionKind: session.kind,
      circleId: session.circleId,
      profileId: session.profileId,
    });
    const wardrobeItem = await pipeline.addDetectedGarmentToCloset(garmentId, new Date().toISOString());

    logWearaboutsTelemetry("api.garment_add.completed", {
      garmentId,
      wardrobeItemId: wardrobeItem.id,
      category: wardrobeItem.category,
      readyForMixer: wardrobeItem.readyForMixer,
      durationMs: timer.elapsedMs(),
    });
    return NextResponse.json({ wardrobeItem });
  } catch (error) {
    logWearaboutsTelemetry("api.garment_add.failed", {
      durationMs: timer.elapsedMs(),
      error: error instanceof Error ? error.message : "Could not add garment to wardrobe.",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add garment to wardrobe." },
      { status: 500 },
    );
  }
}
