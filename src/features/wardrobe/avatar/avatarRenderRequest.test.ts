import { describe, expect, it } from "vitest";
import type { AvatarProfile } from "./avatarTypes";
import type { SavedOutfit } from "@/src/domain/wardrobe";
import { createAvatarRenderRequest } from "./avatarRenderRequest";

const avatarProfile: AvatarProfile = {
  id: "avatar-profile-aankur",
  profileId: "profile-aankur",
  faceAssetId: "face",
  bodyAssetId: "body",
  faceQuality: { status: "passed", reasons: [] },
  bodyQuality: { status: "passed", reasons: [] },
  createdAtIso: "2026-05-28T10:00:00.000Z",
  updatedAtIso: "2026-05-28T10:00:00.000Z",
};

const savedOutfit: SavedOutfit = {
  id: "outfit-1",
  name: "Dinner look",
  profileId: "profile-aankur",
  createdAtIso: "2026-05-28T10:00:00.000Z",
  selections: [
    { slot: "top", wardrobeItemId: "shirt", locked: false },
    { slot: "bottom", wardrobeItemId: "trousers", locked: false },
    { slot: "shoes", wardrobeItemId: null, locked: false },
  ],
};

describe("createAvatarRenderRequest", () => {
  it("creates a final studio request from a saved outfit", () => {
    expect(createAvatarRenderRequest({ avatarProfile, savedOutfit })).toEqual({
      avatarProfileId: "avatar-profile-aankur",
      savedOutfitId: "outfit-1",
      wardrobeItemIds: ["shirt", "trousers"],
      poseId: "studio-three-quarter",
      quality: "final",
      promptVersion: "avatar-studio-v1.5",
    });
  });

  it("throws when avatar profile or wardrobe items are missing", () => {
    expect(() => createAvatarRenderRequest({ avatarProfile: null, savedOutfit })).toThrow("Avatar profile is required");
    expect(() =>
      createAvatarRenderRequest({
        avatarProfile,
        savedOutfit: { ...savedOutfit, selections: [{ slot: "top", wardrobeItemId: null, locked: false }] },
      }),
    ).toThrow("Saved outfit has no wardrobe items");
  });
});
