import type { OutfitSlot, OutfitSlotSelection, WardrobeItem } from "@/src/domain/wardrobe";
import { scoreItemForIntent } from "./outfitCompatibilityScorer";
import { isOnePieceWardrobeItem } from "./outfitSlots";
import type { OutfitIntent, OutfitSuggestion, OutfitSuggestionContext } from "./outfitTypes";

const slots: OutfitSlot[] = ["onePiece", "top", "bottom", "shoes", "layer", "accessory"];
const rainLayerWords = ["rain", "shell", "waterproof", "water-resistant", "technical"];

function itemsForProfile(items: WardrobeItem[], profileId: OutfitSuggestionContext["profileId"]): WardrobeItem[] {
  return items
    .filter(
      (item) => item.readyForMixer && (item.ownerProfileId === profileId || item.ownerProfileId === "profile-shared"),
    )
    .sort((first, second) => Date.parse(second.addedAtIso) - Date.parse(first.addedAtIso));
}

function itemForId(items: WardrobeItem[], itemId: string | null): WardrobeItem | null {
  return itemId ? items.find((item) => item.id === itemId) ?? null : null;
}

function lockedItemForSlot(items: WardrobeItem[], locked: OutfitSlotSelection[], slot: OutfitSlot): WardrobeItem | null | undefined {
  const selection = locked.find((item) => item.slot === slot && item.locked);
  if (!selection) {
    return undefined;
  }

  return itemForId(items, selection.wardrobeItemId);
}

function optionsForSlot(items: WardrobeItem[], lockedItem: WardrobeItem | null | undefined, optional: boolean): Array<WardrobeItem | null> {
  if (lockedItem !== undefined) {
    return [lockedItem];
  }

  if (optional) {
    return items.length > 0 ? [...items, null] : [null];
  }

  return items.length > 0 ? items : [null];
}

function itemText(item: WardrobeItem): string {
  return [item.name, item.brand, item.category, item.material, ...(item.styleTags ?? []), ...(item.occasionTags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function layerOptionsForIntent(layers: WardrobeItem[], intent: OutfitIntent): WardrobeItem[] {
  if (intent === "warm_weather") {
    return [];
  }

  if (intent === "rain_ready") {
    return layers.filter((layer) => layer.rainSuitability === "good" || rainLayerWords.some((word) => itemText(layer).includes(word)));
  }

  return layers;
}

function makeSelections(input: Partial<Record<OutfitSlot, WardrobeItem | null>>, locked: OutfitSlotSelection[] = []) {
  return slots.map((slot) => ({
    slot,
    wardrobeItemId: input[slot]?.id ?? null,
    locked: locked.some((selection) => selection.slot === slot && selection.locked),
  }));
}

function titleAnchor(item: WardrobeItem | null): string {
  if (!item) {
    return "outfit";
  }

  return item.name
    .toLowerCase()
    .replace(/\b(button down|long sleeve|lightweight|travel|hooded|zip)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFor(suggestion: Pick<OutfitSuggestion, "intent" | "selections">, items: WardrobeItem[]): string {
  const onePiece = itemForId(items, suggestion.selections.find((selection) => selection.slot === "onePiece")?.wardrobeItemId ?? null);
  const top = itemForId(items, suggestion.selections.find((selection) => selection.slot === "top")?.wardrobeItemId ?? null);
  const layer = itemForId(items, suggestion.selections.find((selection) => selection.slot === "layer")?.wardrobeItemId ?? null);
  const anchor = titleAnchor(onePiece ?? top ?? layer);

  switch (suggestion.intent) {
    case "dinner":
      return `Dinner-ready ${anchor}`;
    case "travel_day":
      return `Travel-day ${anchor}`;
    case "work":
      return `Work-ready ${anchor}`;
    case "warm_weather":
      return `Warm-weather ${anchor}`;
    case "rain_ready":
      return `Rain-ready ${anchor}`;
    case "casual":
      return `Easy ${anchor}`;
  }
}

function confidenceLabel(score: number): string {
  if (score >= 82) return "Strong match";
  if (score >= 68) return "Good match";
  return "Worth a try";
}

function scoreCandidate(items: Array<WardrobeItem | null>, intent: OutfitSuggestionContext["intent"]): number {
  const presentItems = items.filter((item): item is WardrobeItem => Boolean(item));
  const completeness = presentItems.length * 9;
  const intentScore = presentItems.reduce((total, item) => total + scoreItemForIntent(item, intent), 0);
  return Math.round(completeness + intentScore);
}

function rationaleFor(intent: OutfitSuggestionContext["intent"], selections: OutfitSlotSelection[], items: WardrobeItem[]): string {
  const selected = selections
    .map((selection) => itemForId(items, selection.wardrobeItemId))
    .filter((item): item is WardrobeItem => Boolean(item));
  const names = selected.slice(0, 3).map((item) => item.name.toLowerCase()).join(", ");
  return `Built for ${intent.replace("_", " ")} from ${names}.`;
}

export function buildOutfitSuggestions(context: OutfitSuggestionContext): OutfitSuggestion[] {
  const maxSuggestions = context.maxSuggestions ?? 5;
  const items = itemsForProfile(context.closetItems, context.profileId);
  const onePieces = items.filter(isOnePieceWardrobeItem);
  const tops = items.filter((item) => item.category === "tops");
  const bottoms = items.filter((item) => item.category === "bottoms");
  const shoes = items.filter((item) => item.category === "footwear");
  const layers = items.filter((item) => item.category === "outerwear");
  const accessories = items.filter((item) => item.category === "accessories");
  const locked = context.lockedSelections ?? [];

  if (onePieces.length === 0 && ((tops.length === 0 && layers.length === 0) || bottoms.length === 0)) {
    return [];
  }

  const candidates: OutfitSuggestion[] = [];
  const onePieceOptions = optionsForSlot(onePieces, lockedItemForSlot(items, locked, "onePiece"), false).filter(Boolean);
  const topOptions = optionsForSlot(tops, lockedItemForSlot(items, locked, "top"), false);
  const bottomOptions = optionsForSlot(bottoms, lockedItemForSlot(items, locked, "bottom"), false).filter(Boolean);
  const shoeOptions = optionsForSlot(shoes.slice(0, 3), lockedItemForSlot(items, locked, "shoes"), true);
  const layerOptions = optionsForSlot(
    layerOptionsForIntent(layers, context.intent).slice(0, 3),
    lockedItemForSlot(items, locked, "layer"),
    true,
  );
  const accessoryOptions = optionsForSlot(accessories.slice(0, 2), lockedItemForSlot(items, locked, "accessory"), true);
  const hasLockedTop = lockedItemForSlot(items, locked, "top") !== undefined;
  const hasLockedBottom = lockedItemForSlot(items, locked, "bottom") !== undefined;
  const hasLockedOnePiece = lockedItemForSlot(items, locked, "onePiece") !== undefined;

  if (!hasLockedTop && !hasLockedBottom) {
    for (const onePiece of onePieceOptions) {
      for (const shoe of shoeOptions) {
        for (const layer of layerOptions) {
          for (const accessory of accessoryOptions) {
            const selectedIds = [onePiece, shoe, layer, accessory]
              .filter((item): item is WardrobeItem => Boolean(item))
              .map((item) => item.id);
            if (new Set(selectedIds).size !== selectedIds.length) {
              continue;
            }

            const selections = makeSelections({ onePiece, top: null, bottom: null, shoes: shoe, layer, accessory }, locked);
            const score = scoreCandidate([onePiece, shoe, layer, accessory], context.intent);
            const draft = {
              id: `suggestion-${context.intent}-${selectedIds.join("-")}`,
              profileId: context.profileId,
              intent: context.intent,
              title: "",
              score,
              confidenceLabel: confidenceLabel(score),
              rationale: rationaleFor(context.intent, selections, items),
              selections,
              warnings: shoes.length === 0 ? ["Add shoes to make this look easier to wear as a complete outfit."] : [],
            };

            candidates.push({ ...draft, title: titleFor(draft, items) });
          }
        }
      }
    }
  }

  if (!hasLockedOnePiece) {
    for (const top of topOptions) {
      for (const bottom of bottomOptions) {
        for (const shoe of shoeOptions) {
          for (const layer of layerOptions) {
            for (const accessory of accessoryOptions) {
              const selectedIds = [top, bottom, shoe, layer, accessory]
                .filter((item): item is WardrobeItem => Boolean(item))
                .map((item) => item.id);
              if (new Set(selectedIds).size !== selectedIds.length) {
                continue;
              }

              const selections = makeSelections({ onePiece: null, top, bottom, shoes: shoe, layer, accessory }, locked);
              const score = scoreCandidate([top, bottom, shoe, layer, accessory], context.intent);
              const draft = {
                id: `suggestion-${context.intent}-${selectedIds.join("-")}`,
                profileId: context.profileId,
                intent: context.intent,
                title: "",
                score,
                confidenceLabel: confidenceLabel(score),
                rationale: rationaleFor(context.intent, selections, items),
                selections,
                warnings: shoes.length === 0 ? ["Add shoes to make this look easier to wear as a complete outfit."] : [],
              };

              candidates.push({ ...draft, title: titleFor(draft, items) });
            }
          }
        }
      }
    }
  }

  return candidates.sort((first, second) => second.score - first.score || first.title.localeCompare(second.title)).slice(0, maxSuggestions);
}
