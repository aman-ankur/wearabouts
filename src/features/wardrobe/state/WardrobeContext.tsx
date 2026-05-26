"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { OutfitSlot, UploadSourceType, WardrobeProfileId } from "@/src/domain/wardrobe";
import { createDemoWardrobeProvider } from "@/src/features/wardrobe/providers/demoWardrobeProvider";
import { getInitialMixerSelections } from "@/src/features/wardrobe/selectors/mixerSelectors";
import { initialMixerState, mixerReducer, type MixerState } from "./mixerReducer";
import { initialWardrobeState, wardrobeReducer, type WardrobeState } from "./wardrobeReducer";

interface WardrobeContextValue {
  state: WardrobeState;
  mixerState: MixerState;
  createDemoBatch: (sourceType: UploadSourceType) => Promise<string>;
  retryGarment: (garmentId: string) => Promise<void>;
  addGarment: (garmentId: string) => void;
  deleteGarment: (garmentId: string) => void;
  addAllGarments: () => void;
  startMixer: () => void;
  selectMixerItem: (slot: OutfitSlot, wardrobeItemId: string | null) => void;
  toggleMixerSlotLock: (slot: OutfitSlot) => void;
  saveCurrentOutfit: (name: string, profileId: WardrobeProfileId) => void;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wardrobeReducer, initialWardrobeState);
  const [mixerState, mixerDispatch] = useReducer(mixerReducer, initialMixerState);
  const provider = useMemo(() => createDemoWardrobeProvider(), []);

  const value: WardrobeContextValue = {
    state,
    mixerState,
    async createDemoBatch(sourceType) {
      const batch = await provider.createUploadBatch({ sourceType });
      dispatch({ type: "batchCreated", batch });
      return batch.id;
    },
    async retryGarment(garmentId) {
      if (!state.activeBatch) {
        return;
      }

      const batch = await provider.retryDetectedGarment(state.activeBatch.id, garmentId);
      dispatch({ type: "batchUpdated", batch });
    },
    addGarment(garmentId) {
      dispatch({ type: "garmentAdded", garmentId, addedAtIso: new Date().toISOString() });
    },
    deleteGarment(garmentId) {
      dispatch({ type: "garmentDeleted", garmentId });
    },
    addAllGarments() {
      dispatch({ type: "allGarmentsAdded", addedAtIso: new Date().toISOString() });
    },
    startMixer() {
      mixerDispatch({
        type: "mixerStarted",
        selections: getInitialMixerSelections(state.closetItems),
      });
    },
    selectMixerItem(slot, wardrobeItemId) {
      mixerDispatch({ type: "slotItemSelected", slot, wardrobeItemId });
    },
    toggleMixerSlotLock(slot) {
      mixerDispatch({ type: "slotLockToggled", slot });
    },
    saveCurrentOutfit(name, profileId) {
      mixerDispatch({
        type: "outfitSaved",
        outfitId: `outfit-${Date.now()}`,
        name,
        profileId,
        createdAtIso: new Date().toISOString(),
      });
    },
  };

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const value = useContext(WardrobeContext);

  if (!value) {
    throw new Error("useWardrobe must be used inside WardrobeProvider");
  }

  return value;
}
