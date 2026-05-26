import { NextResponse } from "next/server";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ garmentId: string }> }) {
  try {
    const { garmentId } = await params;
    const { pipeline } = createRealWardrobeServices();
    const wardrobeItem = await pipeline.addDetectedGarmentToCloset(garmentId, new Date().toISOString());

    return NextResponse.json({ wardrobeItem });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add garment to wardrobe." },
      { status: 500 },
    );
  }
}
