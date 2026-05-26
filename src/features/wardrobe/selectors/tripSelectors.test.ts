import { describe, expect, it } from "vitest";
import type { DemoTrip, SavedOutfit, WardrobeItem } from "@/src/domain/wardrobe";
import { createSwappedTripLook, createTripLooks, getPackingListItems } from "./tripSelectors";

const trip: DemoTrip = {
  id: "trip-goa-demo",
  destination: "Goa",
  dateRangeLabel: "3 days",
  profileId: "profile-aankur",
  styleMode: "balanced",
  baggageMode: "carry_on",
  note: "Beach time, one dinner, do not overpack.",
  days: [
    { id: "trip-day-1", label: "Day 1", dateLabel: "Fri", activity: "Arrival and walk" },
    { id: "trip-day-2", label: "Day 2", dateLabel: "Sat", activity: "Beach and cafe" },
    { id: "trip-day-3", label: "Day 3", dateLabel: "Sun", activity: "Dinner and return" },
  ],
};

const closetItems: WardrobeItem[] = [
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

const savedOutfit: SavedOutfit = {
  id: "outfit-demo",
  name: "Saved travel look",
  profileId: "profile-aankur",
  createdAtIso: "2026-05-26T00:00:00.000Z",
  selections: [
    { slot: "top", wardrobeItemId: "wardrobe-saved-top", locked: false },
    { slot: "bottom", wardrobeItemId: "wardrobe-bottom", locked: false },
    { slot: "shoes", wardrobeItemId: "wardrobe-shoes", locked: false },
  ],
};

describe("tripSelectors", () => {
  it("creates one suggested look for each trip day", () => {
    const looks = createTripLooks(trip, closetItems, []);

    expect(looks).toHaveLength(3);
    expect(looks.map((look) => look.tripDayId)).toEqual(["trip-day-1", "trip-day-2", "trip-day-3"]);
    expect(looks.every((look) => look.status === "suggested")).toBe(true);
  });

  it("uses a saved outfit for the first day when available", () => {
    const looks = createTripLooks(trip, closetItems, [savedOutfit]);

    expect(looks[0]?.title).toBe("Saved travel look");
    expect(looks[0]?.selections).toEqual(savedOutfit.selections);
    expect(looks[1]?.title).toBe("Beach day");
  });

  it("deduplicates packing items and counts repeats", () => {
    const looks = createTripLooks(trip, closetItems, [savedOutfit]);

    expect(getPackingListItems(looks)).toEqual([
      { wardrobeItemId: "wardrobe-saved-top", wearCount: 1 },
      { wardrobeItemId: "wardrobe-bottom", wearCount: 3 },
      { wardrobeItemId: "wardrobe-shoes", wearCount: 3 },
      { wardrobeItemId: "wardrobe-top", wearCount: 2 },
    ]);
  });

  it("swaps the first unlocked slot to the next available item", () => {
    const looks = createTripLooks(trip, [
      ...closetItems,
      {
        ...closetItems[0],
        id: "wardrobe-top-2",
        name: "Second Top",
        asset: { id: "asset-top-2", kind: "prettified", label: "Second Top", visualToken: "crew-wine" },
      },
    ], []);

    const swappedLook = createSwappedTripLook(looks[0], [
      ...closetItems,
      {
        ...closetItems[0],
        id: "wardrobe-top-2",
        name: "Second Top",
        asset: { id: "asset-top-2", kind: "prettified", label: "Second Top", visualToken: "crew-wine" },
      },
    ]);

    expect(swappedLook.selections.find((selection) => selection.slot === "top")?.wardrobeItemId).toBe("wardrobe-top-2");
    expect(swappedLook.status).toBe("suggested");
  });
});
