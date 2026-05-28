import { describe, expect, it } from "vitest";
import type { AvatarRenderProviderRequest } from "./avatarRenderProvider";
import { withAvatarProfileReferenceImages } from "./avatarRenderProvider";

const request = {
  request: {
    avatarProfileId: "avatar-profile-aankur",
    savedOutfitId: "outfit-1",
    wardrobeItemIds: ["item-1"],
    poseId: "studio-front",
    quality: "final",
    promptVersion: "avatar-studio-v1.1",
  },
  avatarProfile: {
    id: "avatar-profile-aankur",
    profileId: "profile-aankur",
    faceAssetId: "avatar-face-1",
    bodyAssetId: "avatar-body-1",
    faceQuality: { status: "passed", reasons: [] },
    bodyQuality: { status: "passed", reasons: [] },
    createdAtIso: "2026-05-28T00:00:00.000Z",
    updatedAtIso: "2026-05-28T00:00:00.000Z",
  },
  savedOutfit: {
    id: "outfit-1",
    profileId: "profile-aankur",
    name: "Saved Look",
    selections: [{ slot: "top", wardrobeItemId: "item-1", locked: false }],
    createdAtIso: "2026-05-28T00:00:00.000Z",
  },
  wardrobeItems: [],
  prompt: "Render the outfit.",
  cacheKey: "avatar:cache-key",
  faceImageUrl: "data:image/png;base64,client-face",
  bodyImageUrl: "data:image/png;base64,client-body",
} satisfies AvatarRenderProviderRequest;

describe("withAvatarProfileReferenceImages", () => {
  it("prefers server-resolved avatar reference images over client-sent values", () => {
    expect(
      withAvatarProfileReferenceImages(request, {
        faceImageUrl: "https://storage.example/face.png",
        bodyImageUrl: "https://storage.example/body.png",
      }),
    ).toMatchObject({
      faceImageUrl: "https://storage.example/face.png",
      bodyImageUrl: "https://storage.example/body.png",
    });
  });
});
