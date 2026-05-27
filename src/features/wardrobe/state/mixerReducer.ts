import type { OutfitSlot, OutfitSlotSelection, SavedOutfit, WardrobeProfileId } from "@/src/domain/wardrobe";

export interface MixerState {
  selections: OutfitSlotSelection[];
  savedOutfits: SavedOutfit[];
}

export type MixerAction =
  | { type: "mixerStarted"; selections: OutfitSlotSelection[] }
  | { type: "slotItemSelected"; slot: OutfitSlot; wardrobeItemId: string | null }
  | { type: "slotLockToggled"; slot: OutfitSlot }
  | {
      type: "outfitSaved";
      outfitId: string;
      name: string;
      profileId: WardrobeProfileId;
      createdAtIso: string;
      selections?: OutfitSlotSelection[];
      source?: SavedOutfit["source"];
      intent?: SavedOutfit["intent"];
      rationale?: string;
    };

export const initialMixerState: MixerState = {
  selections: [],
  savedOutfits: [],
};

export function mixerReducer(state: MixerState, action: MixerAction): MixerState {
  switch (action.type) {
    case "mixerStarted":
      return { ...state, selections: action.selections };

    case "slotItemSelected":
      return {
        ...state,
        selections: state.selections.map((selection) => {
          if (selection.slot !== action.slot || selection.locked) {
            return selection;
          }

          return { ...selection, wardrobeItemId: action.wardrobeItemId };
        }),
      };

    case "slotLockToggled":
      return {
        ...state,
        selections: state.selections.map((selection) =>
          selection.slot === action.slot ? { ...selection, locked: !selection.locked } : selection,
        ),
      };

    case "outfitSaved":
      return {
        ...state,
        savedOutfits: [
          ...state.savedOutfits,
          {
            id: action.outfitId,
            name: action.name,
            profileId: action.profileId,
            selections: action.selections ?? state.selections,
            createdAtIso: action.createdAtIso,
            source: action.source ?? "manual",
            intent: action.intent,
            rationale: action.rationale,
          },
        ],
      };
  }
}
