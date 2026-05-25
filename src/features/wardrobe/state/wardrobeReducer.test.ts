import { describe, expect, it } from "vitest";
import { demoUploadBatch } from "@/src/features/wardrobe/fixtures/demoWardrobe";
import { initialWardrobeState, wardrobeReducer } from "./wardrobeReducer";

describe("wardrobeReducer", () => {
  it("stores an active upload batch", () => {
    const state = wardrobeReducer(initialWardrobeState, {
      type: "batchCreated",
      batch: demoUploadBatch,
    });

    expect(state.activeBatch?.id).toBe("batch-demo-upload");
    expect(state.activeBatch?.detectedGarments).toHaveLength(3);
  });

  it("adds one detected garment to the closet and removes it from review", () => {
    const withBatch = wardrobeReducer(initialWardrobeState, {
      type: "batchCreated",
      batch: demoUploadBatch,
    });

    const state = wardrobeReducer(withBatch, {
      type: "garmentAdded",
      garmentId: "detected-brown-jacket",
      addedAtIso: "2026-05-26T01:00:00.000Z",
    });

    expect(state.closetItems).toHaveLength(1);
    expect(state.closetItems[0]?.name).toBe("Brown Hooded Zip Jacket");
    expect(state.activeBatch?.detectedGarments.some((garment) => garment.id === "detected-brown-jacket")).toBe(false);
  });

  it("deletes one detected garment from review without adding it to closet", () => {
    const withBatch = wardrobeReducer(initialWardrobeState, {
      type: "batchCreated",
      batch: demoUploadBatch,
    });

    const state = wardrobeReducer(withBatch, {
      type: "garmentDeleted",
      garmentId: "detected-wine-crew",
    });

    expect(state.closetItems).toHaveLength(0);
    expect(state.activeBatch?.detectedGarments).toHaveLength(2);
  });

  it("adds all remaining detected garments to the closet", () => {
    const withBatch = wardrobeReducer(initialWardrobeState, {
      type: "batchCreated",
      batch: demoUploadBatch,
    });

    const state = wardrobeReducer(withBatch, {
      type: "allGarmentsAdded",
      addedAtIso: "2026-05-26T01:00:00.000Z",
    });

    expect(state.closetItems).toHaveLength(3);
    expect(state.activeBatch?.detectedGarments).toHaveLength(0);
  });
});
