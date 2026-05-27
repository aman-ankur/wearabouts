import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import type { OutfitIntent, OutfitSuggestion } from "./outfitTypes";

const smartWords = ["button", "shirt", "trouser", "loafer", "polo", "blazer", "chino", "dress"];
const casualWords = ["tee", "hood", "sweat", "short", "sneaker", "denim", "graphic"];
const travelWords = ["travel", "light", "soft", "stretch", "knit", "jacket"];
const rainWords = ["rain", "technical", "shell", "hood", "water"];
const warmWords = ["linen", "short", "tee", "light", "cotton"];

function haystack(item: WardrobeItem): string {
  return [item.name, item.brand, item.category, item.pattern, item.material, ...(item.styleTags ?? []), ...(item.occasionTags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function inferFormality(item: WardrobeItem): "casual" | "smart" | "dressy" | "sport" | "technical" {
  if (item.formality) {
    return item.formality;
  }

  const text = haystack(item);
  if (rainWords.some((word) => text.includes(word))) {
    return "technical";
  }
  if (smartWords.some((word) => text.includes(word))) {
    return "smart";
  }
  if (casualWords.some((word) => text.includes(word))) {
    return "casual";
  }

  return item.category === "footwear" ? "smart" : "casual";
}

export function scoreItemForIntent(item: WardrobeItem, intent: OutfitIntent): number {
  const text = haystack(item);
  const formality = inferFormality(item);
  let score = 10;

  if (intent === "dinner" || intent === "work") {
    if (formality === "smart") score += 18;
    if (formality === "dressy") score += 16;
    if (formality === "casual") score -= 4;
  }

  if (intent === "casual") {
    if (formality === "casual") score += 14;
    if (formality === "smart") score += 5;
  }

  if (intent === "travel_day") {
    if (travelWords.some((word) => text.includes(word))) score += 16;
    if (formality === "technical") score += 8;
  }

  if (intent === "warm_weather" && warmWords.some((word) => text.includes(word))) {
    score += 14;
  }

  if (intent === "rain_ready") {
    if (item.rainSuitability === "good") score += 18;
    if (rainWords.some((word) => text.includes(word))) score += 14;
  }

  return score;
}

export function scoreSlotCompatibility(item: WardrobeItem, slot: OutfitSlot, suggestion: OutfitSuggestion): number {
  const lockedNames = suggestion.selections
    .filter((selection) => selection.locked && selection.wardrobeItemId)
    .map((selection) => selection.wardrobeItemId);
  let score = scoreItemForIntent(item, suggestion.intent);

  if (slot === "top" && inferFormality(item) === "smart") {
    score += 6;
  }

  if (lockedNames.length > 0) {
    score += 4;
  }

  return score;
}
