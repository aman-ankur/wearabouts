import { NextResponse } from "next/server";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const { repository } = createRealWardrobeServices();
    const job = await repository.getPrettifyJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Prettify job not found." }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load prettify job." },
      { status: 500 },
    );
  }
}
