import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { getInitialMixerSelections, getItemsForSlot } from "./mixerSelectors";

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
    id: "wardrobe-not-ready",
    sourceDetectedGarmentId: "detected-not-ready",
    name: "Not Ready",
    brand: "",
    category: "tops",
    ownerProfileId: "profile-aankur",
    asset: { id: "asset-not-ready", kind: "prettified", label: "Not Ready", visualToken: "crew-wine" },
    addedAtIso: "2026-05-26T00:00:00.000Z",
    readyForMixer: false,
  },
  {
    id: "wardrobe-dress",
    sourceDetectedGarmentId: "detected-dress",
    name: "Dress",
    brand: "",
    category: "combo",
    ownerProfileId: "profile-aankur",
    asset: { id: "asset-dress", kind: "prettified", label: "Dress", visualToken: "shirt-striped" },
    addedAtIso: "2026-05-26T00:00:00.000Z",
    readyForMixer: true,
  },
  {
    id: "wardrobe-swimsuit",
    sourceDetectedGarmentId: "detected-swimsuit",
    name: "Teal One-Piece Swimsuit",
    brand: "",
    category: "swimwear" as WardrobeItem["category"],
    ownerProfileId: "profile-aankur",
    asset: { id: "asset-swimsuit", kind: "prettified", label: "Swimsuit", visualToken: "shirt-striped" },
    addedAtIso: "2026-05-26T00:00:00.000Z",
    readyForMixer: true,
  },
];

describe("mixerSelectors", () => {
  it("returns only mixer-ready items for a slot", () => {
    expect(getItemsForSlot(items, "top").map((item) => item.id)).toEqual(["wardrobe-top"]);
    expect(getItemsForSlot(items, "bottom").map((item) => item.id)).toEqual(["wardrobe-bottom"]);
    expect(getItemsForSlot(items, "onePiece").map((item) => item.id)).toEqual(["wardrobe-dress", "wardrobe-swimsuit"]);
  });

  it("creates initial selections from available closet items", () => {
    expect(getInitialMixerSelections(items)).toEqual([
      { slot: "onePiece", wardrobeItemId: "wardrobe-dress", locked: false },
      { slot: "top", wardrobeItemId: "wardrobe-top", locked: false },
      { slot: "bottom", wardrobeItemId: "wardrobe-bottom", locked: false },
      { slot: "shoes", wardrobeItemId: null, locked: false },
      { slot: "layer", wardrobeItemId: null, locked: false },
      { slot: "accessory", wardrobeItemId: null, locked: false },
    ]);
  });
});
