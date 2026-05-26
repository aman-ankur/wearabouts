import { describe, expect, it } from "vitest";
import type { UploadBatch, WardrobeItem } from "@/src/domain/wardrobe";
import { demoDetectedGarments, demoUploadBatch } from "@/src/features/wardrobe/fixtures/demoWardrobe";
import { initialWardrobeState, wardrobeReducer } from "./wardrobeReducer";

describe("wardrobeReducer", () => {
  it("stores an active upload batch", () => {
    const state = wardrobeReducer(initialWardrobeState, {
      type: "batchCreated",
      batch: demoUploadBatch,
    });

    expect(state.activeBatch?.id).toBe("batch-demo-upload");
    expect(state.activeBatch?.detectedGarments).toHaveLength(demoDetectedGarments.length);
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
    expect(state.activeBatch?.detectedGarments).toHaveLength(demoDetectedGarments.length - 1);
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

    expect(state.closetItems).toHaveLength(demoDetectedGarments.length);
    expect(state.activeBatch?.detectedGarments).toHaveLength(0);
  });

  it("loads a real upload batch from the API", () => {
    const realBatch: UploadBatch = {
      id: "batch-real-1",
      sourceType: "item_photo",
      title: "Real upload",
      createdAtIso: "2026-05-26T10:00:00.000Z",
      detectedGarments: [],
    };

    const state = wardrobeReducer(initialWardrobeState, { type: "realBatchLoaded", batch: realBatch });

    expect(state.activeBatch).toEqual(realBatch);
  });

  it("loads real closet items from the API", () => {
    const closetItem: WardrobeItem = {
      id: "wardrobe-real-1",
      sourceDetectedGarmentId: "garment-real-1",
      name: "Blue Oxford Shirt",
      brand: "",
      category: "tops",
      ownerProfileId: "profile-aankur",
      asset: {
        id: "asset-real-1",
        kind: "prettified",
        label: "Generated studio asset",
        bucket: "closet-assets",
        storagePath: "demo-household/profile-aankur/asset-real-1.png",
        imageUrl: "https://signed.example/asset.png",
      },
      addedAtIso: "2026-05-26T10:30:00.000Z",
      readyForMixer: true,
    };

    const state = wardrobeReducer(initialWardrobeState, { type: "realClosetLoaded", closetItems: [closetItem] });

    expect(state.closetItems).toEqual([closetItem]);
  });

  it("adds a real garment returned by the API and removes it from review", () => {
    const realBatch: UploadBatch = {
      id: "batch-real-1",
      sourceType: "item_photo",
      title: "Real upload",
      createdAtIso: "2026-05-26T10:00:00.000Z",
      detectedGarments: [
        {
          id: "garment-real-1",
          uploadBatchId: "batch-real-1",
          proposedName: "Blue Oxford Shirt",
          brand: "",
          category: "tops",
          ownerProfileId: "profile-aankur",
          sourceType: "item_photo",
          confidence: "high",
          prettifyStatus: "ready",
          isLayered: false,
          readyForMixer: true,
          asset: {
            id: "asset-real-1",
            kind: "prettified",
            label: "Generated studio asset",
            bucket: "closet-assets",
            storagePath: "demo-household/profile-aankur/asset-real-1.png",
            imageUrl: "https://signed.example/asset.png",
          },
        },
      ],
    };
    const withBatch = wardrobeReducer(initialWardrobeState, { type: "realBatchLoaded", batch: realBatch });
    const wardrobeItem: WardrobeItem = {
      id: "wardrobe-real-1",
      sourceDetectedGarmentId: "garment-real-1",
      name: "Blue Oxford Shirt",
      brand: "",
      category: "tops",
      ownerProfileId: "profile-aankur",
      asset: realBatch.detectedGarments[0].asset,
      addedAtIso: "2026-05-26T10:30:00.000Z",
      readyForMixer: true,
    };

    const state = wardrobeReducer(withBatch, {
      type: "realGarmentAdded",
      garmentId: "garment-real-1",
      wardrobeItem,
    });

    expect(state.closetItems).toEqual([wardrobeItem]);
    expect(state.activeBatch?.detectedGarments).toHaveLength(0);
  });
});
