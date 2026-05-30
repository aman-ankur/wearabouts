import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { createRealWardrobeServices } from "@/src/features/wardrobe/real/createRealWardrobeServices";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const session = await requireAccountSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { batchId } = await params;
    const { repository } = createRealWardrobeServices({ circleId: session.circleId, profileId: session.profileId });
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
