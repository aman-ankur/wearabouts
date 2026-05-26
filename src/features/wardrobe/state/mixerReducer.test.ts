import { describe, expect, it } from "vitest";
import type { OutfitSlotSelection } from "@/src/domain/wardrobe";
import { initialMixerState, mixerReducer } from "./mixerReducer";

const selections: OutfitSlotSelection[] = [
  { slot: "top", wardrobeItemId: "top-1", locked: false },
  { slot: "bottom", wardrobeItemId: "bottom-1", locked: false },
  { slot: "shoes", wardrobeItemId: null, locked: false },
  { slot: "layer", wardrobeItemId: null, locked: false },
  { slot: "accessory", wardrobeItemId: null, locked: false },
];

describe("mixerReducer", () => {
  it("sets initial selections", () => {
    const state = mixerReducer(initialMixerState, { type: "mixerStarted", selections });
    expect(state.selections).toEqual(selections);
  });

  it("selects an item for an unlocked slot", () => {
    const started = mixerReducer(initialMixerState, { type: "mixerStarted", selections });
    const state = mixerReducer(started, { type: "slotItemSelected", slot: "top", wardrobeItemId: "top-2" });
    expect(state.selections.find((selection) => selection.slot === "top")?.wardrobeItemId).toBe("top-2");
  });

  it("does not select an item for a locked slot", () => {
    const started = mixerReducer(initialMixerState, { type: "mixerStarted", selections });
    const locked = mixerReducer(started, { type: "slotLockToggled", slot: "top" });
    const state = mixerReducer(locked, { type: "slotItemSelected", slot: "top", wardrobeItemId: "top-2" });
    expect(state.selections.find((selection) => selection.slot === "top")?.wardrobeItemId).toBe("top-1");
  });

  it("saves the current outfit", () => {
    const started = mixerReducer(initialMixerState, { type: "mixerStarted", selections });
    const state = mixerReducer(started, {
      type: "outfitSaved",
      outfitId: "outfit-1",
      name: "Tokyo walking look",
      profileId: "profile-aankur",
      createdAtIso: "2026-05-26T00:00:00.000Z",
    });

    expect(state.savedOutfits).toHaveLength(1);
    expect(state.savedOutfits[0]?.name).toBe("Tokyo walking look");
    expect(state.savedOutfits[0]?.selections).toEqual(selections);
  });
});
