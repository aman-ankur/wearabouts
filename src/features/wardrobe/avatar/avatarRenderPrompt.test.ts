import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { AVATAR_RENDER_PROMPT_VERSION, buildAvatarRenderPrompt } from "./avatarRenderPrompt";

const item = (id: string, name: string, category: WardrobeItem["category"], extra: Partial<WardrobeItem> = {}): WardrobeItem => ({
  id,
  sourceDetectedGarmentId: `detected-${id}`,
  name,
  brand: "",
  category,
  ownerProfileId: "profile-aankur",
  asset: { id: `asset-${id}`, kind: "prettified", label: name, visualToken: "shirt-striped" },
  addedAtIso: "2026-05-28T10:00:00.000Z",
  readyForMixer: true,
  ...extra,
});

describe("buildAvatarRenderPrompt", () => {
  it("uses a versioned prompt for full-body studio avatar renders", () => {
    const prompt = buildAvatarRenderPrompt({
      savedOutfitName: "Dinner look",
      items: [
        item("shirt", "Striped Shirt", "tops", { colors: ["blue", "white"], pattern: "striped" }),
        item("trousers", "Charcoal Trousers", "bottoms", { colors: ["charcoal"] }),
      ],
      poseId: "studio-three-quarter",
      quality: "final",
    });

    expect(AVATAR_RENDER_PROMPT_VERSION).toBe("avatar-studio-v1.1");
    expect(prompt).toContain("full-body");
    expect(prompt).toContain("neutral light gray or white studio background");
    expect(prompt).toContain("recognizable likeness");
    expect(prompt).toContain("Preserve the same facial structure, face shape, age, skin tone, hairstyle, facial hair, and expression");
    expect(prompt).toContain("body proportions");
    expect(prompt).toContain("natural head-to-body scale");
    expect(prompt).toContain("Prioritize outfit quality");
    expect(prompt).toContain("Striped Shirt");
    expect(prompt).toContain("Do not add extra core garments");
    expect(prompt).toContain("Do not crop the head or feet");
  });

  it("asks for subtle realistic studio polish without changing identity", () => {
    const prompt = buildAvatarRenderPrompt({
      savedOutfitName: "Casual look",
      items: [item("shirt", "Oxford Shirt", "tops")],
      poseId: "studio-front",
      quality: "final",
    });

    expect(prompt).toContain("Apply only very subtle studio-photo polish");
    expect(prompt).toContain("natural skin texture");
    expect(prompt).toContain("cleaner eye and jaw detail");
    expect(prompt).toContain("Avoid beauty filters, face slimming, symmetry changes, younger-looking face, airbrushed skin");
    expect(prompt).toContain("relaxed casual fashion pose");
    expect(prompt).toContain("upright posture");
    expect(prompt).toContain("no hunching");
    expect(prompt).toContain("natural shoulders");
  });
});
