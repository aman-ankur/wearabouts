import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const session = await requireAccountSession(request, { allowGuest: true });
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { itemId } = await params;
    const { pipeline } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
    await pipeline.deleteWardrobeItem(itemId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete wardrobe item." },
      { status: 500 },
    );
  }
}
