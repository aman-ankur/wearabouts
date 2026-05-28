import { NextResponse } from "next/server";
import { AvatarPersistence } from "@/src/features/wardrobe/avatar/avatarPersistence";
import { createSupabaseServiceClient } from "@/src/features/wardrobe/real/supabaseServerClient";

export async function GET() {
  try {
    const persistence = new AvatarPersistence(createSupabaseServiceClient());
    return NextResponse.json({ renders: await persistence.listRenders() });
  } catch (error) {
    return NextResponse.json({ renders: [], error: error instanceof Error ? error.message : "Could not load avatar renders." }, { status: 500 });
  }
}
