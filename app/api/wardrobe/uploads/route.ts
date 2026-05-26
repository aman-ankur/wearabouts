import { NextResponse } from "next/server";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("item_photo") ?? formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a clothing photo file." }, { status: 400 });
    }

    const { pipeline } = createRealWardrobeServices();
    const result = await pipeline.createSingleItemUpload(file);

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
