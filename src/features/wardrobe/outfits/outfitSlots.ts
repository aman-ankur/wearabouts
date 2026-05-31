import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";

export function isOnePieceCategory(category: string): boolean {
  const normalized = category.toLowerCase();
  return (
    normalized === "combo" ||
    normalized === "dress" ||
    normalized === "dresses" ||
    normalized === "jumpsuit" ||
    normalized === "romper" ||
    normalized === "bodysuit" ||
    normalized === "swimsuit"
  );
}

export function isOnePieceWardrobeItem(item: WardrobeItem): boolean {
  if (isOnePieceCategory(item.category)) {
    return true;
  }

  const text = [item.name, item.category, ...(item.styleTags ?? [])].join(" ").toLowerCase();
  return text.includes("one-piece") || text.includes("one piece") || text.includes("onepiece");
}

export function outfitSlotForCategory(category: string): OutfitSlot | null {
  if (isOnePieceCategory(category)) {
    return "onePiece";
  }

  if (category === "tops") {
    return "top";
  }

  if (category === "bottoms") {
    return "bottom";
  }

  if (category === "footwear") {
    return "shoes";
  }

  if (category === "outerwear") {
    return "layer";
  }

  if (category === "accessories") {
    return "accessory";
  }

  return null;
}
