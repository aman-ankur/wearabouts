import { NextResponse } from "next/server";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ garmentId: string }> }) {
  try {
    const { garmentId } = await params;
    const { repository, pipeline } = createRealWardrobeServices();
    const job = await repository.getPrettifyJobByDetectedGarmentId(garmentId);

    if (!job) {
      return NextResponse.json({ error: "Processing job not found for garment." }, { status: 404 });
    }

    await repository.deleteDetectedGarment(garmentId);
    const result = await pipeline.retryPrettifyJob(job.id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not retry garment." },
      { status: 500 },
    );
  }
}
