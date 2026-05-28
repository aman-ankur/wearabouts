import { NextResponse } from "next/server";
import { AvatarPersistence } from "@/src/features/wardrobe/avatar/avatarPersistence";
import { createSupabaseServiceClient } from "@/src/features/wardrobe/real/supabaseServerClient";

export async function DELETE(_request: Request, context: { params: Promise<{ renderId: string }> }) {
  try {
    const { renderId } = await context.params;
    const persistence = new AvatarPersistence(createSupabaseServiceClient());
    return NextResponse.json({ render: await persistence.softDeleteRender(renderId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete avatar render." }, { status: 500 });
  }
}
