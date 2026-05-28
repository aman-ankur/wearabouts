import { describe, expect, it } from "vitest";
import { createAvatarRenderCacheKey } from "./avatarRenderCacheKey";

describe("createAvatarRenderCacheKey", () => {
  const base = {
    avatarProfileId: "avatar-profile-aankur",
    savedOutfitId: "outfit-1",
    wardrobeItemIds: ["trousers", "shirt"],
    poseId: "studio-three-quarter" as const,
    quality: "final" as const,
    promptVersion: "avatar-studio-v1.3",
  };

  it("sorts wardrobe item ids for stable cache hits", () => {
    expect(createAvatarRenderCacheKey(base)).toBe(
      createAvatarRenderCacheKey({ ...base, wardrobeItemIds: ["shirt", "trousers"] }),
    );
  });

  it("changes when pose, quality, or prompt version changes", () => {
    const key = createAvatarRenderCacheKey(base);

    expect(createAvatarRenderCacheKey({ ...base, poseId: "studio-front" })).not.toBe(key);
    expect(createAvatarRenderCacheKey({ ...base, quality: "draft" })).not.toBe(key);
    expect(createAvatarRenderCacheKey({ ...base, promptVersion: "avatar-studio-v2" })).not.toBe(key);
  });
});
