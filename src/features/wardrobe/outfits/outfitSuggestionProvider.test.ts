import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { buildOutfitSuggestions } from "./outfitSuggestionProvider";

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

describe("buildOutfitSuggestions", () => {
  it("returns ranked complete outfits from mixer-ready closet items", () => {
    const suggestions = buildOutfitSuggestions({
      profileId: "profile-aankur",
      intent: "dinner",
      maxSuggestions: 3,
      closetItems: [
        item({ id: "striped-shirt", name: "Striped Button Down Shirt", category: "tops", formality: "smart" }),
        item({ id: "graphic-tee", name: "Washed Graphic Tee", category: "tops", formality: "casual" }),
        item({ id: "trousers", name: "Charcoal Travel Trousers", category: "bottoms", formality: "smart" }),
        item({ id: "loafers", name: "Brown Loafers", category: "footwear", formality: "smart" }),
        item({ id: "jacket", name: "Brown Hooded Zip Jacket", category: "outerwear", formality: "casual" }),
        item({ id: "not-ready", name: "Not Ready Shirt", category: "tops", readyForMixer: false }),
      ],
      savedOutfits: [],
      feedbackSignals: [],
    });

    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]).toMatchObject({
      profileId: "profile-aankur",
      intent: "dinner",
      title: "Dinner-ready striped shirt",
    });
    expect(suggestions[0]?.score).toBeGreaterThan(suggestions[1]?.score ?? 0);
    expect(suggestions[0]?.selections).toEqual(
      expect.arrayContaining([
        { slot: "top", wardrobeItemId: "striped-shirt", locked: false },
        { slot: "bottom", wardrobeItemId: "trousers", locked: false },
        { slot: "shoes", wardrobeItemId: "loafers", locked: false },
        { slot: "layer", wardrobeItemId: "jacket", locked: false },
      ]),
    );
    expect(new Set(suggestions[0]?.selections.map((selection) => selection.wardrobeItemId).filter(Boolean)).size).toBe(
      suggestions[0]?.selections.filter((selection) => selection.wardrobeItemId).length,
    );
    expect(suggestions[0]?.rationale).toContain("dinner");
  });

  it("allows shoe-sparse outfits but warns the user", () => {
    const suggestions = buildOutfitSuggestions({
      profileId: "profile-aankur",
      intent: "travel_day",
      maxSuggestions: 5,
      closetItems: [
        item({ id: "tee", name: "Soft Travel Tee", category: "tops" }),
        item({ id: "trousers", name: "Charcoal Travel Trousers", category: "bottoms" }),
      ],
      savedOutfits: [],
      feedbackSignals: [],
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.selections).toEqual(
      expect.arrayContaining([
        { slot: "top", wardrobeItemId: "tee", locked: false },
        { slot: "bottom", wardrobeItemId: "trousers", locked: false },
        { slot: "shoes", wardrobeItemId: null, locked: false },
      ]),
    );
    expect(suggestions[0]?.warnings).toContain("Add shoes to make this look easier to wear as a complete outfit.");
  });

  it("preserves locked item selections when generating new suggestions", () => {
    const suggestions = buildOutfitSuggestions({
      profileId: "profile-aankur",
      intent: "casual",
      maxSuggestions: 5,
      lockedSelections: [{ slot: "bottom", wardrobeItemId: "travel-trousers", locked: true }],
      closetItems: [
        item({ id: "tee", name: "Soft Tee", category: "tops" }),
        item({ id: "travel-trousers", name: "Charcoal Travel Trousers", category: "bottoms" }),
        item({ id: "jeans", name: "Dark Jeans", category: "bottoms" }),
        item({ id: "sneakers", name: "White Sneakers", category: "footwear" }),
      ],
      savedOutfits: [],
      feedbackSignals: [],
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(
      suggestions.every((suggestion) =>
        suggestion.selections.some(
          (selection) => selection.slot === "bottom" && selection.wardrobeItemId === "travel-trousers" && selection.locked,
        ),
      ),
    ).toBe(true);
  });

  it("prefers newer equivalent items when outfit scores tie", () => {
    const suggestions = buildOutfitSuggestions({
      profileId: "profile-aankur",
      intent: "dinner",
      maxSuggestions: 1,
      closetItems: [
        item({ id: "tee", name: "White Graphic Tee", category: "tops" }),
        item({
          id: "older-trousers",
          name: "Dark Brown Straight-Leg Trousers",
          category: "bottoms",
          addedAtIso: "2026-05-27T14:12:02.852Z",
        }),
        item({
          id: "newer-trousers",
          name: "Dark Brown Trousers",
          category: "bottoms",
          addedAtIso: "2026-05-27T14:43:51.126Z",
        }),
        item({ id: "sneakers", name: "White Sneakers", category: "footwear" }),
      ],
      savedOutfits: [],
      feedbackSignals: [],
    });

    expect(suggestions[0]?.selections).toEqual(
      expect.arrayContaining([{ slot: "bottom", wardrobeItemId: "newer-trousers", locked: false }]),
    );
  });

  it("does not add a generic layer for warm-weather mixes", () => {
    const suggestions = buildOutfitSuggestions({
      profileId: "profile-aankur",
      intent: "warm_weather",
      maxSuggestions: 1,
      closetItems: [
        item({ id: "tee", name: "White Cotton Tee", category: "tops", occasionTags: ["warm_weather"] }),
        item({ id: "cargo", name: "Light Sage Gray Cargo Pants", category: "bottoms" }),
        item({ id: "sneakers", name: "White Chunky Sneakers", category: "footwear" }),
        item({ id: "overshirt", name: "Light Beige Overshirt Jacket", category: "outerwear", warmth: "medium" }),
      ],
      savedOutfits: [],
      feedbackSignals: [],
    });

    expect(suggestions[0]?.selections).toEqual(
      expect.arrayContaining([{ slot: "layer", wardrobeItemId: null, locked: false }]),
    );
  });

  it("only adds rain layers when the layer is actually rain-suitable", () => {
    const suggestions = buildOutfitSuggestions({
      profileId: "profile-aankur",
      intent: "rain_ready",
      maxSuggestions: 1,
      closetItems: [
        item({ id: "tee", name: "White Graphic T-Shirt", category: "tops" }),
        item({ id: "cargo", name: "Light Sage Gray Cargo Pants", category: "bottoms" }),
        item({ id: "sneakers", name: "White Chunky Sneakers", category: "footwear" }),
        item({ id: "overshirt", name: "Light Beige Overshirt Jacket", category: "outerwear", warmth: "medium" }),
        item({ id: "shell", name: "Navy Rain Shell", category: "outerwear", rainSuitability: "good" }),
      ],
      savedOutfits: [],
      feedbackSignals: [],
    });

    expect(suggestions[0]?.selections).toEqual(
      expect.arrayContaining([{ slot: "layer", wardrobeItemId: "shell", locked: false }]),
    );
  });

  it("returns no suggestions when required closet coverage is missing", () => {
    const suggestions = buildOutfitSuggestions({
      profileId: "profile-aankur",
      intent: "casual",
      closetItems: [item({ id: "tee", name: "Soft Tee", category: "tops" })],
      savedOutfits: [],
      feedbackSignals: [],
    });

    expect(suggestions).toEqual([]);
  });
});
