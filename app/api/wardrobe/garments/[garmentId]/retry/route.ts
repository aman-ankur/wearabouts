import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ garmentId: string }> }) {
  try {
    const session = await requireAccountSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { garmentId } = await params;
    const { repository, pipeline } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
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
