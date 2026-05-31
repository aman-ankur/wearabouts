import { NextResponse } from "next/server";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { AvatarPersistence } from "@/src/features/wardrobe/avatar/avatarPersistence";
import { createSupabaseServiceClient } from "@/src/features/wardrobe/real/supabaseServerClient";

export async function GET(request: Request) {
  try {
    const session = await requireAccountSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const persistence = new AvatarPersistence(createSupabaseServiceClient(), { circleId: session.circleId, profileId: session.profileId });
    return NextResponse.json({ renders: await persistence.listRenders() });
  } catch (error) {
    return NextResponse.json({ renders: [], error: error instanceof Error ? error.message : "Could not load avatar renders." }, { status: 500 });
  }
}
