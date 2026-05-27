import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { getItemsForSlot } from "@/src/features/wardrobe/selectors/mixerSelectors";
import { scoreSlotCompatibility } from "./outfitCompatibilityScorer";
import type { OutfitAlternative, OutfitRefinementContext, OutfitSuggestion } from "./outfitTypes";

function currentSelection(suggestion: OutfitSuggestion, slot: OutfitSlot) {
  return suggestion.selections.find((selection) => selection.slot === slot);
}

function selectedIds(suggestion: OutfitSuggestion): Set<string> {
  return new Set(suggestion.selections.map((selection) => selection.wardrobeItemId).filter((id): id is string => Boolean(id)));
}

function lockedItemNames(suggestion: OutfitSuggestion, closetItems: WardrobeItem[]): string {
  const names = suggestion.selections
    .filter((selection) => selection.locked && selection.wardrobeItemId)
    .map((selection) => closetItems.find((item) => item.id === selection.wardrobeItemId)?.name.toLowerCase())
    .filter(Boolean);
  return names.length > 0 ? names.join(", ") : "the locked pieces";
}

export function getRefinementAlternatives(context: OutfitRefinementContext): OutfitAlternative[] {
  const selection = currentSelection(context.suggestion, context.activeSlot);
  if (selection?.locked) {
    return [];
  }

  const usedIds = selectedIds(context.suggestion);
  return getItemsForSlot(context.closetItems, context.activeSlot)
    .filter((item) => item.ownerProfileId === context.suggestion.profileId || item.ownerProfileId === "profile-shared")
    .filter((item) => !usedIds.has(item.id))
    .map((item) => ({
      item,
      score: scoreSlotCompatibility(item, context.activeSlot, context.suggestion),
      reason: `Works with ${lockedItemNames(context.suggestion, context.closetItems)}.`,
    }))
    .sort((first, second) => second.score - first.score || first.item.name.localeCompare(second.item.name));
}

export function refineOutfitSelection(suggestion: OutfitSuggestion, slot: OutfitSlot, wardrobeItemId: string): OutfitSuggestion {
  const selection = currentSelection(suggestion, slot);
  if (selection?.locked) {
    return suggestion;
  }

  return {
    ...suggestion,
    id: `${suggestion.id}-refined-${slot}-${wardrobeItemId}`,
    title: `Refined ${suggestion.title}`,
    selections: suggestion.selections.map((item) => (item.slot === slot ? { ...item, wardrobeItemId } : item)),
  };
}
