import type { DetectedGarment, UploadBatch, WardrobeProfile } from "@/src/domain/wardrobe";

export const demoProfiles: WardrobeProfile[] = [
  { id: "profile-aankur", displayName: "Aankur", shortLabel: "A" },
  { id: "profile-wife", displayName: "Wife", shortLabel: "W" },
  { id: "profile-shared", displayName: "Shared", shortLabel: "S" },
];

export const demoDetectedGarments: DetectedGarment[] = [
  {
    id: "detected-brown-jacket",
    uploadBatchId: "batch-demo-upload",
    proposedName: "Brown Hooded Zip Jacket",
    brand: "",
    category: "outerwear",
    ownerProfileId: "profile-aankur",
    sourceType: "outfit_photo",
    confidence: "high",
    prettifyStatus: "ready",
    isLayered: false,
    readyForMixer: true,
    asset: {
      id: "asset-brown-jacket",
      kind: "prettified",
      label: "Brown jacket prettified asset",
      visualToken: "jacket-brown",
    },
    retryVariantId: "detected-brown-jacket-retry",
  },
  {
    id: "detected-cream-sweater",
    uploadBatchId: "batch-demo-upload",
    proposedName: "Lightweight Knit Crewneck Sweater",
    brand: "",
    category: "tops",
    ownerProfileId: "profile-aankur",
    sourceType: "item_photo",
    confidence: "high",
    prettifyStatus: "ready",
    isLayered: false,
    readyForMixer: true,
    asset: {
      id: "asset-cream-sweater",
      kind: "prettified",
      label: "Cream sweater prettified asset",
      visualToken: "sweater-cream",
    },
    retryVariantId: "detected-cream-sweater-retry",
  },
  {
    id: "detected-wine-crew",
    uploadBatchId: "batch-demo-upload",
    proposedName: "Maroon Long Sleeve Crew Neck",
    brand: "",
    category: "tops",
    ownerProfileId: "profile-aankur",
    sourceType: "item_photo",
    confidence: "medium",
    prettifyStatus: "needs_review",
    isLayered: false,
    readyForMixer: true,
    asset: {
      id: "asset-wine-crew",
      kind: "prettified",
      label: "Maroon crew neck prettified asset",
      visualToken: "crew-wine",
    },
    retryVariantId: "detected-wine-crew-retry",
  },
];

export const demoRetryVariants: Record<string, DetectedGarment> = {
  "detected-brown-jacket-retry": {
    ...demoDetectedGarments[0],
    id: "detected-brown-jacket",
    proposedName: "Tan Technical Hooded Jacket",
    confidence: "high",
    prettifyStatus: "ready",
  },
  "detected-cream-sweater-retry": {
    ...demoDetectedGarments[1],
    id: "detected-cream-sweater",
    proposedName: "Cream Ribbed Knit Sweater",
    confidence: "high",
    prettifyStatus: "ready",
  },
  "detected-wine-crew-retry": {
    ...demoDetectedGarments[2],
    id: "detected-wine-crew",
    proposedName: "Burgundy Crew Neck Sweatshirt",
    confidence: "high",
    prettifyStatus: "ready",
  },
};

export const demoUploadBatch: UploadBatch = {
  id: "batch-demo-upload",
  sourceType: "batch_upload",
  title: "Demo Auto-Prettify Batch",
  createdAtIso: "2026-05-26T00:00:00.000Z",
  detectedGarments: demoDetectedGarments,
};
