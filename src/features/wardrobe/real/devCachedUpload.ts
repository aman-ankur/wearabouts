import type { ClosetAsset, DetectedGarment, UploadBatch, WardrobeItem } from "@/src/domain/wardrobe";

export interface DevCachedUploadRepository {
  listWardrobeItems: () => Promise<WardrobeItem[]>;
  createUploadBatch: (input: { sourceType: "item_photo"; title: string }) => Promise<UploadBatch>;
  createDetectedGarment: (input: {
    uploadBatchId: string;
    proposedName: string;
    category: DetectedGarment["category"];
    confidence: DetectedGarment["confidence"];
    prettifyStatus: DetectedGarment["prettifyStatus"];
    readyForMixer: boolean;
    asset: ClosetAsset;
  }) => Promise<DetectedGarment>;
}

export async function createDevCachedUpload(repository: DevCachedUploadRepository, uploadedFilename: string) {
  const cachedItems = await repository.listWardrobeItems();
  const cachedItem = cachedItems.at(-1);
  if (!cachedItem) {
    throw new Error("Dev mode needs at least one cached closet item.");
  }

  const batch = await repository.createUploadBatch({
    sourceType: "item_photo",
    title: `Dev cached upload: ${uploadedFilename}`,
  });
  const garment = await repository.createDetectedGarment({
    uploadBatchId: batch.id,
    proposedName: cachedItem.name,
    category: cachedItem.category,
    confidence: "high",
    prettifyStatus: "ready",
    readyForMixer: cachedItem.readyForMixer,
    asset: cachedItem.asset,
  });

  return {
    batch: { ...batch, detectedGarments: [garment] },
    garment,
    cachedFromWardrobeItemId: cachedItem.id,
  };
}
