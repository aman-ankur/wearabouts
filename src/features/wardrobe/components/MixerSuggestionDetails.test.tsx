import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import type { OutfitSuggestion } from "@/src/features/wardrobe/outfits/outfitTypes";
import { MixerSuggestionDetails } from "./MixerSuggestionDetails";

function item(overrides: Pick<WardrobeItem, "id" | "name" | "category">): WardrobeItem {
  return {
    sourceDetectedGarmentId: `detected-${overrides.id}`,
    brand: "",
    ownerProfileId: "profile-aankur",
    asset: { id: `asset-${overrides.id}`, kind: "prettified", label: overrides.name, visualToken: "shirt-striped" },
    addedAtIso: "2026-05-28T08:00:00.000Z",
    readyForMixer: true,
    ...overrides,
  };
}

const closetItems = [
  item({ id: "layer", name: "Light Beige Overshirt Jacket", category: "outerwear" }),
  item({ id: "top", name: "White Graphic T-Shirt", category: "tops" }),
  item({ id: "bottom", name: "Dark Brown Straight-Leg Trousers", category: "bottoms" }),
  item({ id: "shoes", name: "White Chunky Sneakers", category: "footwear" }),
];

const suggestion: OutfitSuggestion = {
  id: "suggestion-casual",
  profileId: "profile-aankur",
  intent: "casual",
  title: "Easy white graphic t-shirt",
  score: 126,
  confidenceLabel: "Strong match",
  rationale: "Built for casual from white graphic t-shirt, dark brown straight-leg trousers, white chunky sneakers.",
  selections: [
    { slot: "layer", wardrobeItemId: "layer", locked: false },
    { slot: "top", wardrobeItemId: "top", locked: false },
    { slot: "bottom", wardrobeItemId: "bottom", locked: false },
    { slot: "shoes", wardrobeItemId: "shoes", locked: false },
    { slot: "accessory", wardrobeItemId: null, locked: false },
  ],
  warnings: [],
};

describe("MixerSuggestionDetails", () => {
  it("shows full selected pieces without exposing the internal score", () => {
    const html = renderToStaticMarkup(<MixerSuggestionDetails suggestion={suggestion} closetItems={closetItems} />);

    expect(html).toContain("Pieces");
    expect(html).toContain("Layer");
    expect(html).toContain("Light Beige Overshirt Jacket");
    expect(html).toContain("Bottom");
    expect(html).toContain("Dark Brown Straight-Leg Trousers");
    expect(html).not.toContain("Score");
    expect(html).not.toContain("126");
  });
});
