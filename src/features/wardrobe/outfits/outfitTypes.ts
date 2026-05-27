import type { OutfitSlot, OutfitSlotSelection, SavedOutfit, WardrobeItem, WardrobeProfileId } from "@/src/domain/wardrobe";

export type OutfitIntent = "casual" | "dinner" | "travel_day" | "work" | "warm_weather" | "rain_ready";

export interface OutfitFeedbackSignal {
  wardrobeItemId: string;
  signal: "liked" | "rejected" | "saved";
  weight?: number;
}

export interface OutfitSuggestionContext {
  profileId: WardrobeProfileId;
  intent: OutfitIntent;
  closetItems: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  feedbackSignals: OutfitFeedbackSignal[];
  lockedSelections?: OutfitSlotSelection[];
  maxSuggestions?: number;
}

export interface OutfitSuggestion {
  id: string;
  profileId: WardrobeProfileId;
  intent: OutfitIntent;
  title: string;
  score: number;
  confidenceLabel: string;
  rationale: string;
  selections: OutfitSlotSelection[];
  warnings: string[];
}

export interface OutfitRefinementContext {
  suggestion: OutfitSuggestion;
  activeSlot: OutfitSlot;
  closetItems: WardrobeItem[];
}

export interface OutfitAlternative {
  item: WardrobeItem;
  score: number;
  reason: string;
}
