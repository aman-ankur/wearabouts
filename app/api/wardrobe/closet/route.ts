import { NextResponse } from "next/server";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { repository } = createRealWardrobeServices();
    const closetItems = await repository.listWardrobeItems();

    return NextResponse.json({ closetItems });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load wardrobe." },
      { status: 500 },
    );
  }
}
