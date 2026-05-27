import type { OutfitFeedbackSignal } from "./outfitTypes";

export function createSavedFeedbackSignal(wardrobeItemId: string): OutfitFeedbackSignal {
  return { wardrobeItemId, signal: "saved", weight: 1 };
}
