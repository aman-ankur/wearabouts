import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { getClosetItemsForFilter } from "./closetSelectors";

const items: WardrobeItem[] = [
  {
    id: "wardrobe-top",
    sourceDetectedGarmentId: "detected-top",
    name: "Top",
    brand: "",
    category: "tops",
    ownerProfileId: "profile-aankur",
    asset: { id: "asset-top", kind: "prettified", label: "Top", visualToken: "shirt-striped" },
    addedAtIso: "2026-05-26T00:00:00.000Z",
    readyForMixer: true,
  },
  {
    id: "wardrobe-bottom",
    sourceDetectedGarmentId: "detected-bottom",
    name: "Bottom",
    brand: "",
    category: "bottoms",
    ownerProfileId: "profile-aankur",
    asset: { id: "asset-bottom", kind: "prettified", label: "Bottom", visualToken: "trouser-charcoal" },
    addedAtIso: "2026-05-26T00:00:00.000Z",
    readyForMixer: true,
  },
  {
    id: "wardrobe-shoes",
    sourceDetectedGarmentId: "detected-shoes",
    name: "Shoes",
    brand: "",
    category: "footwear",
    ownerProfileId: "profile-aankur",
    asset: { id: "asset-shoes", kind: "prettified", label: "Shoes", visualToken: "shoe-brown" },
    addedAtIso: "2026-05-26T00:00:00.000Z",
    readyForMixer: true,
  },
];

describe("closetSelectors", () => {
  it("returns all items for the all filter", () => {
    expect(getClosetItemsForFilter(items, "all").map((item) => item.id)).toEqual([
      "wardrobe-top",
      "wardrobe-bottom",
      "wardrobe-shoes",
    ]);
  });

  it("returns category-specific closet items", () => {
    expect(getClosetItemsForFilter(items, "tops").map((item) => item.id)).toEqual(["wardrobe-top"]);
    expect(getClosetItemsForFilter(items, "bottoms").map((item) => item.id)).toEqual(["wardrobe-bottom"]);
    expect(getClosetItemsForFilter(items, "shoes").map((item) => item.id)).toEqual(["wardrobe-shoes"]);
  });
});
