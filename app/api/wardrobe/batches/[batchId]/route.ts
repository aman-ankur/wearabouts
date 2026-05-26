import { NextResponse } from "next/server";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await params;
    const { repository } = createRealWardrobeServices();
    const batch = await repository.getUploadBatchWithGarments(batchId);

    if (!batch) {
      return NextResponse.json({ error: "Upload batch not found." }, { status: 404 });
    }

    return NextResponse.json({ batch });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load upload batch." },
      { status: 500 },
    );
  }
}
