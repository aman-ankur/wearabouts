import { NextResponse } from "next/server";
import type { AvatarInputQualityCheck } from "@/src/features/wardrobe/avatar/avatarTypes";
import { AvatarPersistence } from "@/src/features/wardrobe/avatar/avatarPersistence";
import { createSupabaseServiceClient } from "@/src/features/wardrobe/real/supabaseServerClient";
import { REAL_PROFILE_ID } from "@/src/features/wardrobe/real/realWardrobeConfig";

export async function GET() {
  try {
    const persistence = new AvatarPersistence(createSupabaseServiceClient());
    return NextResponse.json({ profile: await persistence.getProfile() });
  } catch (error) {
    return NextResponse.json({ profile: null, error: error instanceof Error ? error.message : "Could not load avatar profile." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      faceDataUrl: string;
      bodyDataUrl: string;
      faceQuality: AvatarInputQualityCheck;
      bodyQuality: AvatarInputQualityCheck;
    };
    const persistence = new AvatarPersistence(createSupabaseServiceClient());
    const profile = await persistence.upsertProfile({
      profileId: REAL_PROFILE_ID,
      faceDataUrl: payload.faceDataUrl,
      bodyDataUrl: payload.bodyDataUrl,
      faceQuality: payload.faceQuality,
      bodyQuality: payload.bodyQuality,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save avatar profile." }, { status: 500 });
  }
}
