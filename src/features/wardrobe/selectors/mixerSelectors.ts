import type { GarmentCategory, OutfitSlot, OutfitSlotSelection, WardrobeItem } from "@/src/domain/wardrobe";

const slotCategoryMap: Record<OutfitSlot, GarmentCategory[]> = {
  top: ["tops"],
  bottom: ["bottoms"],
  shoes: ["footwear"],
  layer: ["outerwear"],
  accessory: ["accessories"],
};

export const mixerSlots: OutfitSlot[] = ["top", "bottom", "shoes", "layer", "accessory"];

export function getItemsForSlot(items: WardrobeItem[], slot: OutfitSlot): WardrobeItem[] {
  const categories = slotCategoryMap[slot];
  return items.filter((item) => item.readyForMixer && categories.includes(item.category));
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
