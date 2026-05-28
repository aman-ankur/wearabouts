import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import type { StylistLook } from "@/src/features/wardrobe/stylist/stylistTypes";
import { StylistLookCard } from "./StylistLookCard";

const addedAtIso = "2026-05-28T08:00:00.000Z";

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

const closetItems: WardrobeItem[] = [
  item({ id: "shirt", name: "Linen Shirt", category: "tops" }),
  item({ id: "trousers", name: "Charcoal Trousers", category: "bottoms" }),
  item({ id: "loafers", name: "Brown Loafers", category: "footwear" }),
];

const look: StylistLook = {
  id: "stylist-best",
  variant: "best",
  title: "Best choice",
  suggestion: {
    id: "suggestion-1",
    profileId: "profile-aankur",
    intent: "dinner",
    title: "Dinner-ready linen shirt",
    score: 91,
    confidenceLabel: "Strong match",
    rationale: "Built for dinner from linen shirt.",
    selections: [
      { slot: "top", wardrobeItemId: "shirt", locked: false },
      { slot: "bottom", wardrobeItemId: "trousers", locked: false },
      { slot: "shoes", wardrobeItemId: "loafers", locked: false },
      { slot: "layer", wardrobeItemId: null, locked: false },
      { slot: "accessory", wardrobeItemId: null, locked: false },
    ],
    warnings: [],
  },
  weatherRationale: "Built for warm and humid around Mumbai.",
  styleRationale: "Balances practicality, comfort, and style for the moment.",
  caveats: [],
  missingPieceIdeas: [],
};

describe("StylistLookCard", () => {
  it("renders the variant label and closet-only copy", () => {
    const html = renderToStaticMarkup(<StylistLookCard look={look} closetItems={closetItems} onSave={() => {}} onRefine={() => {}} />);

    expect(html).toContain("Best choice");
    expect(html).toContain("Closet-only look");
    expect(html).not.toContain("Score");
    expect(html).not.toContain("Not in your closet");
  });

  it("shows missing-piece idea labels only when present", () => {
    const html = renderToStaticMarkup(
      <StylistLookCard
        look={{
          ...look,
          missingPieceIdeas: [
            {
              id: "overshirt",
              label: "Cropped charcoal overshirt",
              category: "outerwear",
              why: "Sharpens dinner looks.",
              pairsWithWardrobeItemIds: ["shirt", "trousers"],
            },
          ],
        }}
        closetItems={closetItems}
        onSave={() => {}}
        onRefine={() => {}}
      />,
    );

    expect(html).toContain("Not in your closet");
    expect(html).toContain("Cropped charcoal overshirt");
    expect(html).toContain("Missing-piece idea");
  });

  it("shows save and refine actions", () => {
    const html = renderToStaticMarkup(<StylistLookCard look={look} closetItems={closetItems} onSave={() => {}} onRefine={() => {}} />);

    expect(html).toContain("Save");
    expect(html).toContain("Refine");
  });
});
