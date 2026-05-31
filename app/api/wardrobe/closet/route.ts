import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";
import { createTimer, logWearaboutsTelemetry } from "@/src/features/wardrobe/real/prettifyTelemetry";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const timer = createTimer();
  try {
    const session = await requireAccountSession(request, { allowGuest: true });
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { repository } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
    logWearaboutsTelemetry("api.closet_load.started", {
      sessionKind: session.kind,
      circleId: session.circleId,
      profileId: session.profileId,
    });
    const closetItems = await repository.listWardrobeItems();

    logWearaboutsTelemetry("api.closet_load.completed", {
      closetItemCount: closetItems.length,
      durationMs: timer.elapsedMs(),
    });
    return NextResponse.json({ closetItems });
  } catch (error) {
    logWearaboutsTelemetry("api.closet_load.failed", {
      durationMs: timer.elapsedMs(),
      error: error instanceof Error ? error.message : "Could not load wardrobe.",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load wardrobe." },
      { status: 500 },
    );
  }
}
