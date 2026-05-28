import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AvatarPersistence } from "@/src/features/wardrobe/avatar/avatarPersistence";
import { createAvatarUploadSlot, isSupportedAvatarUploadContentType } from "@/src/features/wardrobe/avatar/avatarUploadSlot";
import type { AvatarInputKind } from "@/src/features/wardrobe/avatar/avatarTypes";
import { REAL_HOUSEHOLD_ID, REAL_PROFILE_ID } from "@/src/features/wardrobe/real/realWardrobeConfig";
import { createSupabaseServiceClient } from "@/src/features/wardrobe/real/supabaseServerClient";

function isAvatarInputKind(value: string): value is AvatarInputKind {
  return value === "face" || value === "body";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { kind?: string; contentType?: string };
    if (!payload.kind || !isAvatarInputKind(payload.kind)) {
      return NextResponse.json({ error: "Expected avatar input kind face or body." }, { status: 400 });
    }

    if (!payload.contentType || !isSupportedAvatarUploadContentType(payload.contentType)) {
      return NextResponse.json({ error: "Expected PNG, JPEG, or WebP avatar photo." }, { status: 400 });
    }

    const slot = createAvatarUploadSlot({
      householdId: REAL_HOUSEHOLD_ID,
      profileId: REAL_PROFILE_ID,
      kind: payload.kind,
      contentType: payload.contentType,
      token: randomUUID(),
    });
    const upload = await new AvatarPersistence(createSupabaseServiceClient()).createUploadUrl(slot);

    return NextResponse.json({ ...slot, signedUrl: upload.signedUrl, token: upload.token });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create avatar upload URL." }, { status: 500 });
  }
}
