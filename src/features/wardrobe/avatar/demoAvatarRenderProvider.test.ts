import { describe, expect, it } from "vitest";
import { buildAvatarRenderPrompt } from "./avatarRenderPrompt";
import { createDemoAvatarRenderProvider } from "./demoAvatarRenderProvider";
import type { AvatarRenderProviderRequest } from "./avatarRenderProvider";

const providerRequest: AvatarRenderProviderRequest = {
  request: {
    avatarProfileId: "avatar-profile-aankur",
    savedOutfitId: "outfit-1",
    wardrobeItemIds: ["shirt", "trousers"],
    poseId: "studio-three-quarter",
    quality: "final",
    promptVersion: "avatar-studio-v1.5",
  },
  avatarProfile: {
    id: "avatar-profile-aankur",
    profileId: "profile-aankur",
    faceAssetId: "face",
    bodyAssetId: "body",
    faceQuality: { status: "passed", reasons: [] },
    bodyQuality: { status: "passed", reasons: [] },
    createdAtIso: "2026-05-28T10:00:00.000Z",
    updatedAtIso: "2026-05-28T10:00:00.000Z",
  },
  savedOutfit: {
    id: "outfit-1",
    name: "Dinner look",
    profileId: "profile-aankur",
    createdAtIso: "2026-05-28T10:00:00.000Z",
    selections: [{ slot: "top", wardrobeItemId: "shirt", locked: false }],
  },
  wardrobeItems: [],
  prompt: buildAvatarRenderPrompt({ savedOutfitName: "Dinner look", items: [], poseId: "studio-three-quarter", quality: "final" }),
  cacheKey: "avatar:cache-key",
};

describe("createDemoAvatarRenderProvider", () => {
  it("returns deterministic ready renders without network", async () => {
    const provider = createDemoAvatarRenderProvider();

    await expect(provider.renderAvatar(providerRequest)).resolves.toMatchObject({
      status: "ready",
      imageAssetId: "demo-avatar-avatar-cache-key",
      qualityNotes: ["Demo provider render. No AI was called."],
    });
    await expect(provider.renderAvatar(providerRequest)).resolves.toEqual(await provider.renderAvatar(providerRequest));
  });

  it("can simulate a failed provider result", async () => {
    const provider = createDemoAvatarRenderProvider({ forceFailure: true });
    await expect(provider.renderAvatar(providerRequest)).resolves.toMatchObject({
      status: "failed",
      qualityNotes: ["Demo provider forced failure."],
    });
  });
});
