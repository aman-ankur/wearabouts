import { describe, expect, it, vi } from "vitest";
import { createRealAvatarRenderProvider, isAvatarRealRenderEnabled } from "./realAvatarRenderProvider";
import type { AvatarRenderProviderRequest } from "./avatarRenderProvider";

const tinyPng =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

const request: AvatarRenderProviderRequest = {
  request: {
    avatarProfileId: "avatar-profile-aankur",
    savedOutfitId: "outfit-1",
    wardrobeItemIds: ["shirt"],
    poseId: "studio-three-quarter",
    quality: "final",
    promptVersion: "avatar-studio-v1.3",
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
  wardrobeItems: [
    {
      id: "shirt",
      sourceDetectedGarmentId: "detected-shirt",
      name: "Striped Shirt",
      brand: "",
      category: "tops",
      ownerProfileId: "profile-aankur",
      asset: { id: "asset-shirt", kind: "prettified", label: "Striped Shirt", bucket: "closet-assets", storagePath: "shirt.png", imageUrl: `data:image/png;base64,${tinyPng}` },
      addedAtIso: "2026-05-28T10:00:00.000Z",
      readyForMixer: true,
    },
  ],
  prompt: "Render a full-body avatar.",
  cacheKey: "avatar:cache-key",
  faceImageUrl: `data:image/png;base64,${tinyPng}`,
  bodyImageUrl: `data:image/png;base64,${tinyPng}`,
};

describe("realAvatarRenderProvider", () => {
  it("checks the explicit real render flag", () => {
    expect(isAvatarRealRenderEnabled({ avatarRealRenderEnabled: false })).toBe(false);
    expect(isAvatarRealRenderEnabled({ avatarRealRenderEnabled: true })).toBe(true);
  });

  it("does not call OpenAI when the avatar flag is off", async () => {
    const client = { images: { edit: vi.fn() } };
    const provider = createRealAvatarRenderProvider({
      client,
      config: { avatarRealRenderEnabled: false, model: "gpt-image-2", size: "1024x1536", quality: "high" },
    });

    await expect(provider.renderAvatar(request)).resolves.toMatchObject({ status: "failed" });
    expect(client.images.edit).not.toHaveBeenCalled();
  });

  it("sends face, body, and wardrobe references with configured model, size, quality, and prompt", async () => {
    const client = { images: { edit: vi.fn().mockResolvedValue({ data: [{ b64_json: "cmVuZGVy" }] }) } };
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const provider = createRealAvatarRenderProvider({
      client,
      config: { avatarRealRenderEnabled: true, model: "gpt-image-2", size: "1024x1536", quality: "high" },
    });

    await expect(provider.renderAvatar(request)).resolves.toMatchObject({
      status: "ready",
      imageUrl: "data:image/png;base64,cmVuZGVy",
    });
    expect(client.images.edit).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-image-2",
        size: "1024x1536",
        quality: "high",
        prompt: "Render a full-body avatar.",
        image: expect.arrayContaining([expect.anything(), expect.anything(), expect.anything()]),
      }),
    );
    expect(info).toHaveBeenCalledWith(expect.stringContaining("wearabouts.telemetry.avatar.real_render.completed"));
    expect(info).toHaveBeenCalledWith(expect.stringContaining("wearabouts.telemetry.avatar.real_render.references_prepared"));
    expect(info).toHaveBeenCalledWith(expect.stringContaining("\"estimatedOutputCostUsd\":0.165"));
    info.mockRestore();
  });

  it("maps provider errors to a failed result", async () => {
    const client = { images: { edit: vi.fn().mockRejectedValue(new Error("network")) } };
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const provider = createRealAvatarRenderProvider({
      client,
      config: { avatarRealRenderEnabled: true, model: "gpt-image-2", size: "1024x1536", quality: "high" },
    });

    await expect(provider.renderAvatar(request)).resolves.toMatchObject({
      status: "failed",
      qualityNotes: ["Real avatar render failed: network"],
    });
    expect(info).toHaveBeenCalledWith(expect.stringContaining("wearabouts.telemetry.avatar.real_render.failed"));
    info.mockRestore();
  });
});
