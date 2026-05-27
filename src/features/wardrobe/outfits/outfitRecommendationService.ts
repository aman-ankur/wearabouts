import { buildOutfitSuggestions } from "./outfitSuggestionProvider";
import type { OutfitSuggestion, OutfitSuggestionContext } from "./outfitTypes";

export function getOutfitRecommendations(context: OutfitSuggestionContext): OutfitSuggestion[] {
  return buildOutfitSuggestions(context);
}
