"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { UploadSourceType } from "@/src/domain/wardrobe";
import { createDemoWardrobeProvider } from "@/src/features/wardrobe/providers/demoWardrobeProvider";
import { initialWardrobeState, wardrobeReducer, type WardrobeState } from "./wardrobeReducer";

interface WardrobeContextValue {
  state: WardrobeState;
  createDemoBatch: (sourceType: UploadSourceType) => Promise<string>;
  retryGarment: (garmentId: string) => Promise<void>;
  addGarment: (garmentId: string) => void;
  deleteGarment: (garmentId: string) => void;
  addAllGarments: () => void;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wardrobeReducer, initialWardrobeState);
  const provider = useMemo(() => createDemoWardrobeProvider(), []);

  const value: WardrobeContextValue = {
    state,
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
