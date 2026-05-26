import type { DemoTrip, PackingListItem, SavedOutfit, TripLook, WardrobeItem } from "@/src/domain/wardrobe";
import { getInitialMixerSelections, getItemsForSlot, mixerSlots } from "./mixerSelectors";

const demoLookTitles = ["Arrival walk", "Beach day", "Dinner plan"];
const demoLookNotes = ["Easy layers for travel.", "Light pieces for sun and cafe time.", "A sharper outfit for dinner."];

export function createTripLooks(trip: DemoTrip, closetItems: WardrobeItem[], savedOutfits: SavedOutfit[]): TripLook[] {
  const fallbackSelections = getInitialMixerSelections(closetItems);

  return trip.days.map((day, index) => {
    const savedOutfit = index === 0 ? savedOutfits[0] : undefined;

    return {
      id: `${trip.id}-${day.id}-look`,
      tripDayId: day.id,
      title: savedOutfit?.name ?? demoLookTitles[index % demoLookTitles.length],
      note: savedOutfit ? "Saved from Wardrobe Mixer." : demoLookNotes[index % demoLookNotes.length],
      status: "suggested",
      selections: savedOutfit?.selections ?? fallbackSelections,
    };
  });
}

export function getPackingListItems(looks: TripLook[]): PackingListItem[] {
  const itemCounts = new Map<string, number>();

  looks.forEach((look) => {
    look.selections.forEach((selection) => {
      if (!selection.wardrobeItemId) {
        return;
      }

      itemCounts.set(selection.wardrobeItemId, (itemCounts.get(selection.wardrobeItemId) ?? 0) + 1);
    });
  });

  return Array.from(itemCounts, ([wardrobeItemId, wearCount]) => ({ wardrobeItemId, wearCount }));
}

export function createSwappedTripLook(look: TripLook, closetItems: WardrobeItem[]): TripLook {
  const swappableSlot = mixerSlots.find((slot) => {
    const selection = look.selections.find((item) => item.slot === slot);
    return selection && !selection.locked && getItemsForSlot(closetItems, slot).length > 1;
  });

  if (!swappableSlot) {
    return { ...look, status: "suggested" };
  }

  const slotItems = getItemsForSlot(closetItems, swappableSlot);
  const selection = look.selections.find((item) => item.slot === swappableSlot);
  const selectedIndex = slotItems.findIndex((item) => item.id === selection?.wardrobeItemId);
  const nextItem = slotItems[(selectedIndex + 1) % slotItems.length];

  return {
    ...look,
    title: `${look.title} remix`,
    note: "Swapped one unlocked item for another demo option.",
    status: "suggested",
    selections: look.selections.map((item) =>
      item.slot === swappableSlot ? { ...item, wardrobeItemId: nextItem?.id ?? item.wardrobeItemId } : item,
    ),
  };
}
