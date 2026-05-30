import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/features/account/accountSession", () => ({
  requireAccountSession: vi.fn(async () => ({
    ok: true,
    supabase: {},
    user: { id: "user-1", email: "aankur@example.com" },
    userId: "user-1",
    email: "aankur@example.com",
    circleId: "circle-1",
    profileId: "profile-1",
  })),
}));

describe("avatar render API", () => {
  const previousMode = process.env.NEXT_PUBLIC_TRAVOGUE_MODE;

  afterEach(() => {
    process.env.NEXT_PUBLIC_TRAVOGUE_MODE = previousMode;
  });

  it("rejects a render request for a different wardrobe profile in real mode", async () => {
    process.env.NEXT_PUBLIC_TRAVOGUE_MODE = "real";
    const { POST } = await import("@/app/api/wardrobe/avatar/render/route");

    const response = await POST(
      new Request("https://wearabouts.test/api/wardrobe/avatar/render", {
        method: "POST",
        headers: { Authorization: "Bearer token-1", "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarProfile: { profileId: "profile-from-another-circle" },
          request: { avatarProfileId: "avatar-profile-other", savedOutfitId: "outfit-1", wardrobeItemIds: [] },
          savedOutfit: { id: "outfit-1" },
          wardrobeItems: [],
          prompt: "",
          cacheKey: "cache-1",
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({ error: "That wardrobe profile is not available in your Circle." });
    expect(response.status).toBe(403);
  });
});
