import type { DemoTrip, PackingListItem, SavedOutfit, TripLook, WardrobeItem } from "@/src/domain/wardrobe";
import { getInitialMixerSelections } from "./mixerSelectors";

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
      note: savedOutfit ? "Saved from Closet Mixer." : demoLookNotes[index % demoLookNotes.length],
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
