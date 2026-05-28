import { NextResponse } from "next/server";
import type { AvatarInputQualityCheck, AvatarStoredInput } from "@/src/features/wardrobe/avatar/avatarTypes";
import { AvatarPersistence } from "@/src/features/wardrobe/avatar/avatarPersistence";
import { toAvatarProfileResponse } from "@/src/features/wardrobe/avatar/avatarProfileResponse";
import { isAvatarStoredInputForSlot } from "@/src/features/wardrobe/avatar/avatarUploadSlot";
import { createSupabaseServiceClient } from "@/src/features/wardrobe/real/supabaseServerClient";
import { REAL_HOUSEHOLD_ID, REAL_PROFILE_ID } from "@/src/features/wardrobe/real/realWardrobeConfig";

export async function GET() {
  try {
    const persistence = new AvatarPersistence(createSupabaseServiceClient());
    const profile = await persistence.getProfile();
    return NextResponse.json({ profile: toAvatarProfileResponse(profile) });
  } catch (error) {
    return NextResponse.json({ profile: null, error: error instanceof Error ? error.message : "Could not load avatar profile." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      face: AvatarStoredInput;
      body: AvatarStoredInput;
      faceQuality: AvatarInputQualityCheck;
      bodyQuality: AvatarInputQualityCheck;
    };
    if (
      !isAvatarStoredInputForSlot({ householdId: REAL_HOUSEHOLD_ID, profileId: REAL_PROFILE_ID, kind: "face", storedInput: payload.face }) ||
      !isAvatarStoredInputForSlot({ householdId: REAL_HOUSEHOLD_ID, profileId: REAL_PROFILE_ID, kind: "body", storedInput: payload.body })
    ) {
      return NextResponse.json({ error: "Avatar profile inputs must come from Wearabouts avatar uploads." }, { status: 400 });
    }

    const persistence = new AvatarPersistence(createSupabaseServiceClient());
    const profile = await persistence.upsertProfile({
      profileId: REAL_PROFILE_ID,
      face: payload.face,
      body: payload.body,
      faceQuality: payload.faceQuality,
      bodyQuality: payload.bodyQuality,
    });

    return NextResponse.json({ profile: toAvatarProfileResponse(profile) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save avatar profile." }, { status: 500 });
  }
}
