import { NextResponse } from "next/server";
import { createDevCachedUpload } from "@/src/features/wardrobe/real/devCachedUpload";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("item_photo") ?? formData.get("file");
    const filename = file instanceof File ? file.name : "cached-dev-upload";

    const { repository } = createRealWardrobeServices();
    const result = await createDevCachedUpload(repository, filename);

    return NextResponse.json({
      batchId: result.batch.id,
      garmentId: result.garment.id,
      cachedFromWardrobeItemId: result.cachedFromWardrobeItemId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create cached dev upload." },
      { status: 500 },
    );
  }
}
