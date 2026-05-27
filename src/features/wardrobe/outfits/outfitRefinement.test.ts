import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import type { OutfitSuggestion } from "./outfitTypes";
import { getRefinementAlternatives, refineOutfitSelection } from "./outfitRefinement";

const addedAtIso = "2026-05-27T00:00:00.000Z";

function item(overrides: Partial<WardrobeItem> & Pick<WardrobeItem, "id" | "name" | "category">): WardrobeItem {
  return {
    sourceDetectedGarmentId: `detected-${overrides.id}`,
    brand: "",
    ownerProfileId: "profile-aankur",
    asset: { id: `asset-${overrides.id}`, kind: "prettified", label: overrides.name, visualToken: "shirt-striped" },
    addedAtIso,
    readyForMixer: true,
    ...overrides,
  };
}

const baseSuggestion: OutfitSuggestion = {
  id: "suggestion-1",
  profileId: "profile-aankur",
  intent: "dinner",
  title: "Dinner-ready striped shirt",
  score: 84,
  confidenceLabel: "Strong match",
  rationale: "Smart pieces work for dinner.",
  warnings: [],
  selections: [
    { slot: "top", wardrobeItemId: "striped-shirt", locked: false },
    { slot: "bottom", wardrobeItemId: "trousers", locked: true },
    { slot: "shoes", wardrobeItemId: "loafers", locked: false },
    { slot: "layer", wardrobeItemId: null, locked: false },
    { slot: "accessory", wardrobeItemId: null, locked: false },
  ],
};

describe("outfitRefinement", () => {
  it("returns ranked alternatives only for an unlocked active slot", () => {
    const alternatives = getRefinementAlternatives({
      suggestion: baseSuggestion,
      activeSlot: "top",
      closetItems: [
        item({ id: "striped-shirt", name: "Striped Button Down Shirt", category: "tops", formality: "smart" }),
        item({ id: "cream-knit", name: "Cream Knit Polo", category: "tops", formality: "smart" }),
        item({ id: "washed-tee", name: "Washed Graphic Tee", category: "tops", formality: "casual" }),
        item({ id: "trousers", name: "Charcoal Travel Trousers", category: "bottoms", formality: "smart" }),
        item({ id: "other-profile-shirt", name: "Other Profile Shirt", category: "tops", ownerProfileId: "profile-wife" }),
      ],
    });

    expect(alternatives.map((alternative) => alternative.item.id)).toEqual(["cream-knit", "washed-tee"]);
    expect(alternatives[0]?.score).toBeGreaterThan(alternatives[1]?.score ?? 0);
    expect(alternatives[0]?.reason).toContain("trousers");
  });

  it("does not return alternatives for locked slots", () => {
    expect(
      getRefinementAlternatives({
        suggestion: baseSuggestion,
        activeSlot: "bottom",
        closetItems: [item({ id: "jeans", name: "Dark Jeans", category: "bottoms" })],
      }),
    ).toEqual([]);
  });

  it("swaps an unlocked slot while preserving locked selections", () => {
    const refined = refineOutfitSelection(baseSuggestion, "top", "cream-knit");

    expect(refined.selections).toEqual(
      expect.arrayContaining([
        { slot: "top", wardrobeItemId: "cream-knit", locked: false },
        { slot: "bottom", wardrobeItemId: "trousers", locked: true },
      ]),
    );
    expect(refined.title).toBe("Refined Dinner-ready striped shirt");
  });
});
