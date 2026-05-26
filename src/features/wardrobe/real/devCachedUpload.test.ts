import { describe, expect, it } from "vitest";
import type { DetectedGarment, WardrobeItem } from "@/src/domain/wardrobe";
import { createDevCachedUpload, type DevCachedUploadRepository } from "./devCachedUpload";

const cachedItem: WardrobeItem = {
  id: "wardrobe-cached-1",
  sourceDetectedGarmentId: "garment-source-1",
  name: "Cached Linen Overshirt",
  brand: "",
  category: "tops",
  ownerProfileId: "profile-aankur",
  asset: {
    id: "asset-cached-1",
    kind: "prettified",
    label: "Cached studio asset",
    bucket: "closet-assets",
    storagePath: "demo-household/profile-aankur/cached.png",
    imageUrl: "https://signed.example/cached.png",
  },
  addedAtIso: "2026-05-26T10:00:00.000Z",
  readyForMixer: true,
};

function createRepository(items: WardrobeItem[]): DevCachedUploadRepository {
  return {
    async listWardrobeItems() {
      return items;
    },
    async createUploadBatch(input) {
      return {
        id: "batch-dev-cache-1",
        sourceType: input.sourceType,
        title: input.title,
        createdAtIso: "2026-05-26T11:00:00.000Z",
        detectedGarments: [],
      };
    },
    async createDetectedGarment(input) {
      const garment: DetectedGarment = {
        id: "garment-dev-cache-1",
        uploadBatchId: input.uploadBatchId,
        proposedName: input.proposedName,
        brand: "",
        category: input.category,
        ownerProfileId: "profile-aankur",
        sourceType: "item_photo",
        confidence: input.confidence,
        prettifyStatus: input.prettifyStatus,
        isLayered: false,
        readyForMixer: input.readyForMixer,
        asset: input.asset,
      };

      return garment;
    },
  };
}

describe("createDevCachedUpload", () => {
  it("creates a review batch from the latest cached wardrobe item", async () => {
    const result = await createDevCachedUpload(createRepository([cachedItem]), "test upload.jpg");

    expect(result.batch.id).toBe("batch-dev-cache-1");
    expect(result.garment.proposedName).toBe("Cached Linen Overshirt");
    expect(result.garment.asset).toMatchObject({ imageUrl: "https://signed.example/cached.png" });
  });

  it("fails clearly when no cached real items exist", async () => {
    await expect(createDevCachedUpload(createRepository([]), "test upload.jpg")).rejects.toThrow(
      "Dev mode needs at least one cached closet item.",
    );
  });
});
