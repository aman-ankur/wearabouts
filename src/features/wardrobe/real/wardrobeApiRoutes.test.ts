import { describe, expect, it, vi } from "vitest";
import { GET as getAvatarProfile } from "@/app/api/wardrobe/avatar/profile/route";
import { GET as getCloset } from "@/app/api/wardrobe/closet/route";
import { wearaboutsGuestIdHeader } from "@/src/features/account/accountSession";

const mocks = vi.hoisted(() => ({
  serviceOwners: [] as Array<{ circleId: string; profileId: string }>,
}));

vi.mock("@/src/features/wardrobe/real/createRealWardrobeServices", () => ({
  createRealWardrobeServices: (owner: { circleId: string; profileId: string }) => {
    mocks.serviceOwners.push(owner);
    return {
      repository: {
        listWardrobeItems: async () => [],
      },
    };
  },
}));

vi.mock("@/src/features/account/supabaseAccountServerClient", () => ({
  createSupabaseAccountServerClient: () => ({}),
}));

describe("private wardrobe API routes", () => {
  it("requires authentication before loading private closet items", async () => {
    const response = await getCloset(new Request("https://wearabouts.test/api/wardrobe/closet"));

    await expect(response.json()).resolves.toEqual({ error: "Sign in to continue." });
    expect(response.status).toBe(401);
  });

  it("requires authentication before loading a private avatar profile", async () => {
    const response = await getAvatarProfile(new Request("https://wearabouts.test/api/wardrobe/avatar/profile"));

    await expect(response.json()).resolves.toEqual({ error: "Sign in to continue." });
    expect(response.status).toBe(401);
  });

  it("loads closet items for an unauthenticated temporary guest workspace", async () => {
    const response = await getCloset(
      new Request("https://wearabouts.test/api/wardrobe/closet", {
        headers: { [wearaboutsGuestIdHeader]: "018f77c2-2e8b-4a69-9ac7-31d0f05d90aa" },
      }),
    );

    await expect(response.json()).resolves.toEqual({ closetItems: [] });
    expect(response.status).toBe(200);
    expect(mocks.serviceOwners).toContainEqual({
      circleId: "guest-018f77c2-2e8b-4a69-9ac7-31d0f05d90aa",
      profileId: "guest-profile-018f77c2-2e8b-4a69-9ac7-31d0f05d90aa",
    });
  });
});
