import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { AvatarPersistence } from "@/src/features/wardrobe/avatar/avatarPersistence";
import { createSupabaseServiceClient } from "@/src/features/wardrobe/real/supabaseServerClient";

export async function DELETE(request: Request, context: { params: Promise<{ renderId: string }> }) {
  try {
    const session = await requireAccountSession(request, { allowGuest: true });
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { renderId } = await context.params;
    const persistence = new AvatarPersistence(createSupabaseServiceClient(), { circleId: session.circleId, profileId: session.profileId });
    await persistence.deleteRender(renderId);
    return NextResponse.json({ deletedRenderId: renderId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete avatar render." }, { status: 500 });
  }
}
