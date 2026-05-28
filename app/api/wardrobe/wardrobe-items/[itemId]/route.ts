import { NextResponse } from "next/server";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const { pipeline } = createRealWardrobeServices();
    await pipeline.deleteWardrobeItem(itemId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete wardrobe item." },
      { status: 500 },
    );
  }
}
