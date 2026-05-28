import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SavedOutfit } from "@/src/domain/wardrobe";
import { SavedOutfitList } from "./SavedOutfitList";

const outfit: SavedOutfit = {
  id: "outfit-1",
  name: "Dinner look",
  profileId: "profile-aankur",
  createdAtIso: "2026-05-28T10:00:00.000Z",
  selections: [
    { slot: "top", wardrobeItemId: "shirt", locked: false },
    { slot: "bottom", wardrobeItemId: "trousers", locked: false },
    { slot: "shoes", wardrobeItemId: null, locked: false },
  ],
};

describe("SavedOutfitList", () => {
  it("shows avatar handoff links for saved outfits", () => {
    const html = renderToStaticMarkup(<SavedOutfitList outfits={[outfit]} />);

    expect(html).toContain("Dinner look");
    expect(html).toContain("2 items");
    expect(html).toContain("You");
    expect(html).not.toContain(["Aan", "kur"].join(""));
    expect(html).toContain("Render avatar preview");
    expect(html).toContain("/avatar?savedOutfitId=outfit-1");
  });

  it("keeps the empty state unchanged", () => {
    const html = renderToStaticMarkup(<SavedOutfitList outfits={[]} />);

    expect(html).toContain("No saved looks yet.");
    expect(html).not.toContain("Render avatar preview");
  });
});
