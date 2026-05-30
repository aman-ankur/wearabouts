import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ garmentId: string }> }) {
  try {
    const session = await requireAccountSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { garmentId } = await params;
    const { pipeline } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
    const wardrobeItem = await pipeline.addDetectedGarmentToCloset(garmentId, new Date().toISOString());

    return NextResponse.json({ wardrobeItem });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add garment to wardrobe." },
      { status: 500 },
    );
  }
}
