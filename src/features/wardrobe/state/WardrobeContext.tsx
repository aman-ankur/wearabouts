"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { OutfitSlot, UploadBatch, UploadSourceType, WardrobeItem, WardrobeProfileId } from "@/src/domain/wardrobe";
import { getRuntimeMode } from "@/src/features/runtime/runtimeMode";
import { demoTrip } from "@/src/features/wardrobe/fixtures/demoTrip";
import { createDemoWardrobeProvider } from "@/src/features/wardrobe/providers/demoWardrobeProvider";
import { getInitialMixerSelections } from "@/src/features/wardrobe/selectors/mixerSelectors";
import { createSwappedTripLook, createTripLooks } from "@/src/features/wardrobe/selectors/tripSelectors";
import { initialMixerState, mixerReducer, type MixerState } from "./mixerReducer";
import { initialTripState, tripReducer, type TripState } from "./tripReducer";
import { initialWardrobeState, wardrobeReducer, type WardrobeState } from "./wardrobeReducer";

interface WardrobeContextValue {
  state: WardrobeState;
  mixerState: MixerState;
  tripState: TripState;
  createDemoBatch: (sourceType: UploadSourceType) => Promise<string>;
  retryGarment: (garmentId: string) => Promise<void>;
  addGarment: (garmentId: string) => void;
  deleteGarment: (garmentId: string) => void;
  addAllGarments: () => void;
  loadRealBatch: (batchId: string) => Promise<UploadBatch>;
  addRealGarment: (garmentId: string) => Promise<WardrobeItem>;
  retryRealGarment: (garmentId: string) => Promise<void>;
  generateRealCandidates: (jobId: string, candidateIds: string[]) => Promise<void>;
  startMixer: () => void;
  selectMixerItem: (slot: OutfitSlot, wardrobeItemId: string | null) => void;
  toggleMixerSlotLock: (slot: OutfitSlot) => void;
  saveCurrentOutfit: (name: string, profileId: WardrobeProfileId) => void;
  startDemoTrip: () => void;
  approveTripLook: (lookId: string) => void;
  swapTripLook: (lookId: string) => void;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wardrobeReducer, initialWardrobeState);
  const [mixerState, mixerDispatch] = useReducer(mixerReducer, initialMixerState);
  const [tripState, tripDispatch] = useReducer(tripReducer, initialTripState);
  const provider = useMemo(() => createDemoWardrobeProvider(), []);
  const runtimeMode = useMemo(() => getRuntimeMode(), []);

  useEffect(() => {
    if (runtimeMode !== "real" && runtimeMode !== "dev") {
      return;
    }

    void fetch("/api/wardrobe/closet")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Could not load closet."))))
      .then((payload: { closetItems: WardrobeItem[] }) => {
        dispatch({ type: "realClosetLoaded", closetItems: payload.closetItems });
      })
      .catch(() => {
        dispatch({ type: "realClosetLoaded", closetItems: [] });
      });
  }, [runtimeMode]);

  const loadRealBatch = useCallback(async (batchId: string) => {
    const response = await fetch(`/api/wardrobe/batches/${batchId}`);
    if (!response.ok) {
      throw new Error("Could not load upload batch.");
    }

    const payload = (await response.json()) as { batch: UploadBatch };
    dispatch({ type: "realBatchLoaded", batch: payload.batch });
    return payload.batch;
  }, []);

  const addRealGarment = useCallback(async (garmentId: string) => {
    const response = await fetch(`/api/wardrobe/garments/${garmentId}/add`, { method: "POST" });
    if (!response.ok) {
      throw new Error("Could not add garment to closet.");
    }

    const payload = (await response.json()) as { wardrobeItem: WardrobeItem };
    dispatch({ type: "realGarmentAdded", garmentId, wardrobeItem: payload.wardrobeItem });
    return payload.wardrobeItem;
  }, []);

  const retryRealGarment = useCallback(async (garmentId: string) => {
    const response = await fetch(`/api/wardrobe/garments/${garmentId}/retry`, { method: "POST" });
    if (!response.ok) {
      throw new Error("Could not retry garment.");
    }
  }, []);

  const generateRealCandidates = useCallback(async (jobId: string, candidateIds: string[]) => {
    const response = await fetch(`/api/wardrobe/jobs/${jobId}/candidates/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateIds }),
    });
    if (!response.ok) {
      throw new Error("Could not prepare selected pieces.");
    }
  }, []);

  const value: WardrobeContextValue = {
    state,
    mixerState,
    tripState,
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
    loadRealBatch,
    addRealGarment,
    retryRealGarment,
    generateRealCandidates,
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
    startDemoTrip() {
      tripDispatch({
        type: "tripStarted",
        trip: demoTrip,
        looks: createTripLooks(demoTrip, state.closetItems, mixerState.savedOutfits),
      });
    },
    approveTripLook(lookId) {
      tripDispatch({ type: "tripLookApproved", lookId });
    },
    swapTripLook(lookId) {
      const look = tripState.tripLooks.find((item) => item.id === lookId);
      if (!look) {
        return;
      }

      tripDispatch({
        type: "tripLookSwapped",
        lookId,
        look: createSwappedTripLook(look, state.closetItems),
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
