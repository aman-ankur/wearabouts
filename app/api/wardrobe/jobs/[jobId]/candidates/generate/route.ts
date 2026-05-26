import { NextResponse } from "next/server";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const payload = (await request.json()) as { candidateIds?: unknown };
    const candidateIds = Array.isArray(payload.candidateIds)
      ? payload.candidateIds.filter((candidateId): candidateId is string => typeof candidateId === "string")
      : [];

    if (candidateIds.length === 0) {
      return NextResponse.json({ error: "Choose at least one detected piece to prepare." }, { status: 400 });
    }

    const { pipeline } = createRealWardrobeServices();
    const result = await pipeline.generateOutfitCandidates(jobId, candidateIds);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not prepare selected pieces." },
      { status: 500 },
    );
  }
}
