import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await requireAccountSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { repository } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
    const closetItems = await repository.listWardrobeItems();

    return NextResponse.json({ closetItems });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load wardrobe." },
      { status: 500 },
    );
  }
}
