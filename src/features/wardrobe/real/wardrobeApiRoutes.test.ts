import { describe, expect, it } from "vitest";
import { GET as getAvatarProfile } from "@/app/api/wardrobe/avatar/profile/route";
import { GET as getCloset } from "@/app/api/wardrobe/closet/route";

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
});
