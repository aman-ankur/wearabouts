import type { ClosetAsset, DetectedGarment, UploadBatch, UploadSourceType, WardrobeItem } from "@/src/domain/wardrobe";

export interface DevCachedUploadRepository {
  listWardrobeItems: () => Promise<WardrobeItem[]>;
  createUploadBatch: (input: { sourceType: Extract<UploadSourceType, "item_photo" | "outfit_photo">; title: string }) => Promise<UploadBatch>;
  createDetectedGarment: (input: {
    uploadBatchId: string;
    proposedName: string;
    category: DetectedGarment["category"];
    confidence: DetectedGarment["confidence"];
    prettifyStatus: DetectedGarment["prettifyStatus"];
    readyForMixer: boolean;
    sourceType?: Extract<UploadSourceType, "item_photo" | "outfit_photo">;
    asset: ClosetAsset;
  }) => Promise<DetectedGarment>;
}

export async function createDevCachedUpload(
  repository: DevCachedUploadRepository,
  input: { sourceType: Extract<UploadSourceType, "item_photo" | "outfit_photo">; uploadedFilename: string },
) {
  const cachedItems = await repository.listWardrobeItems();
  const cachedSelection = input.sourceType === "outfit_photo" ? cachedItems.slice(-4) : cachedItems.slice(-1);
  if (cachedSelection.length === 0) {
    throw new Error("Dev mode needs at least one cached wardrobe item.");
  }

  const batch = await repository.createUploadBatch({
    sourceType: input.sourceType,
    title: `Dev cached upload: ${input.uploadedFilename}`,
  });
  const garments = await Promise.all(
    cachedSelection.map((cachedItem) =>
      repository.createDetectedGarment({
        uploadBatchId: batch.id,
        proposedName: cachedItem.name,
        category: cachedItem.category,
        confidence: "high",
        prettifyStatus: "ready",
        readyForMixer: cachedItem.readyForMixer,
        sourceType: input.sourceType,
        asset: cachedItem.asset,
      }),
    ),
  );

  return {
    batch: { ...batch, detectedGarments: garments },
    garment: garments[0],
    cachedFromWardrobeItemId: cachedSelection.at(-1)?.id,
  };
}
