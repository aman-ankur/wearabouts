import type { OutfitSlot, OutfitSlotSelection, WardrobeItem } from "@/src/domain/wardrobe";
import { isOnePieceWardrobeItem } from "@/src/features/wardrobe/outfits/outfitSlots";

export const mixerSlots: OutfitSlot[] = ["onePiece", "top", "bottom", "shoes", "layer", "accessory"];

export function getItemsForSlot(items: WardrobeItem[], slot: OutfitSlot): WardrobeItem[] {
  return items.filter((item) => {
    if (!item.readyForMixer) {
      return false;
    }

    if (slot === "onePiece") {
      return isOnePieceWardrobeItem(item);
    }

    if (slot === "top") {
      return item.category === "tops";
    }

    if (slot === "bottom") {
      return item.category === "bottoms";
    }

    if (slot === "shoes") {
      return item.category === "footwear";
    }

    if (slot === "layer") {
      return item.category === "outerwear";
    }

    return item.category === "accessories";
  });
}

export function getInitialMixerSelections(items: WardrobeItem[]): OutfitSlotSelection[] {
  return mixerSlots.map((slot) => ({
    slot,
    wardrobeItemId: getItemsForSlot(items, slot)[0]?.id ?? null,
    locked: false,
  }));
}

export function getSelectedItem(items: WardrobeItem[], selection: OutfitSlotSelection): WardrobeItem | null {
  if (!selection.wardrobeItemId) {
    return null;
  }

  return items.find((item) => item.id === selection.wardrobeItemId) ?? null;
}
