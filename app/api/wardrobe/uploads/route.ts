import { NextResponse } from "next/server";
import type { OutfitExtractionMode } from "@/src/domain/wardrobe";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("item_photo") ?? formData.get("file");
    const sourceType = formData.get("source_type") === "outfit_photo" ? "outfit_photo" : "item_photo";
    const requestedExtractionMode = formData.get("extraction_mode");
    const extractionMode = getExtractionMode(requestedExtractionMode, sourceType);
    const skipExistingItems = formData.get("skip_existing_items") !== "false";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a clothing photo file." }, { status: 400 });
    }

    const { pipeline } = createRealWardrobeServices();
    const result =
      sourceType === "outfit_photo"
        ? await pipeline.createOutfitUpload(file, { extractionMode, skipExistingItems })
        : await pipeline.createSingleItemUpload(file);

    return NextResponse.json({
      batchId: result.batch.id,
      jobId: result.job.id,
      sourceImageId: result.sourceImage.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 },
    );
  }
}

function getExtractionMode(
  value: FormDataEntryValue | null,
  sourceType: "item_photo" | "outfit_photo",
): OutfitExtractionMode {
  if (sourceType === "item_photo") {
    return "single_item";
  }

  return value === "new_tops" || value === "new_bottoms" || value === "core_outfit"
    ? value
    : "pick_after_scan";
}
