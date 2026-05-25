import type { DetectedGarment, UploadBatch, WardrobeItem } from "@/src/domain/wardrobe";

export interface WardrobeState {
  activeBatch: UploadBatch | null;
  closetItems: WardrobeItem[];
}

export type WardrobeAction =
  | { type: "batchCreated"; batch: UploadBatch }
  | { type: "batchUpdated"; batch: UploadBatch }
  | { type: "garmentAdded"; garmentId: string; addedAtIso: string }
  | { type: "garmentDeleted"; garmentId: string }
  | { type: "allGarmentsAdded"; addedAtIso: string };

export const initialWardrobeState: WardrobeState = {
  activeBatch: null,
  closetItems: [],
};

function toWardrobeItem(garment: DetectedGarment, addedAtIso: string): WardrobeItem {
  return {
    id: `wardrobe-${garment.id}`,
    sourceDetectedGarmentId: garment.id,
    name: garment.proposedName,
    brand: garment.brand,
    category: garment.category,
    ownerProfileId: garment.ownerProfileId,
    asset: garment.asset,
    addedAtIso,
    readyForMixer: garment.readyForMixer,
  };
}

function removeDetectedGarment(batch: UploadBatch, garmentId: string): UploadBatch {
  return {
    ...batch,
    detectedGarments: batch.detectedGarments.filter((garment) => garment.id !== garmentId),
  };
}

function closetContainsGarment(state: WardrobeState, garmentId: string): boolean {
  return state.closetItems.some((item) => item.sourceDetectedGarmentId === garmentId);
}

export function wardrobeReducer(state: WardrobeState, action: WardrobeAction): WardrobeState {
  switch (action.type) {
    case "batchCreated":
      return { ...state, activeBatch: action.batch };

    case "batchUpdated":
      return { ...state, activeBatch: action.batch };

    case "garmentDeleted":
      return state.activeBatch
        ? { ...state, activeBatch: removeDetectedGarment(state.activeBatch, action.garmentId) }
        : state;

    case "garmentAdded": {
      if (!state.activeBatch || closetContainsGarment(state, action.garmentId)) {
        return state;
      }

      const garment = state.activeBatch.detectedGarments.find((item) => item.id === action.garmentId);
      if (!garment) {
        return state;
      }

      return {
        activeBatch: removeDetectedGarment(state.activeBatch, action.garmentId),
        closetItems: [...state.closetItems, toWardrobeItem(garment, action.addedAtIso)],
      };
    }

    case "allGarmentsAdded": {
      if (!state.activeBatch) {
        return state;
      }

      const newItems = state.activeBatch.detectedGarments
        .filter((garment) => !closetContainsGarment(state, garment.id))
        .map((garment) => toWardrobeItem(garment, action.addedAtIso));

      return {
        activeBatch: { ...state.activeBatch, detectedGarments: [] },
        closetItems: [...state.closetItems, ...newItems],
      };
    }
  }
}
