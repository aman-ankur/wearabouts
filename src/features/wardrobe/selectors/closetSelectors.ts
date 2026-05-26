import type { WardrobeItem } from "@/src/domain/wardrobe";

export type ClosetFilter = "all" | "tops" | "bottoms" | "shoes";

export function getClosetItemsForFilter(items: WardrobeItem[], filter: ClosetFilter): WardrobeItem[] {
  if (filter === "all") {
    return items;
  }

  if (filter === "shoes") {
    return items.filter((item) => item.category === "footwear");
  }

  return items.filter((item) => item.category === filter);
}
