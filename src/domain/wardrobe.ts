export type RuntimeMode = "demo" | "real";

export type WardrobeProfileId = "profile-aankur" | "profile-wife" | "profile-shared";

export type GarmentCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "footwear"
  | "accessories"
  | "combo";

export type UploadSourceType = "outfit_photo" | "item_photo" | "batch_upload";

export type ConfidenceLevel = "high" | "medium" | "low";

export type PrettifyStatus = "not_started" | "processing" | "ready" | "needs_review" | "failed";

export interface WardrobeProfile {
  id: WardrobeProfileId;
  displayName: string;
  shortLabel: string;
}

export interface ClosetAsset {
  id: string;
  kind: "original" | "detected_crop" | "prettified" | "thumbnail";
  label: string;
  visualToken:
    | "jacket-brown"
    | "sweater-cream"
    | "crew-wine"
    | "shirt-striped"
    | "trouser-charcoal"
    | "shoe-brown";
}

export interface DetectedGarment {
  id: string;
  uploadBatchId: string;
  proposedName: string;
  brand: string;
  category: GarmentCategory;
  ownerProfileId: WardrobeProfileId;
  sourceType: UploadSourceType;
  confidence: ConfidenceLevel;
  prettifyStatus: PrettifyStatus;
  isLayered: boolean;
  readyForMixer: boolean;
  asset: ClosetAsset;
  retryVariantId?: string;
}

export interface WardrobeItem {
  id: string;
  sourceDetectedGarmentId: string;
  name: string;
  brand: string;
  category: GarmentCategory;
  ownerProfileId: WardrobeProfileId;
  asset: ClosetAsset;
  addedAtIso: string;
  readyForMixer: boolean;
}

export interface UploadBatch {
  id: string;
  sourceType: UploadSourceType;
  title: string;
  createdAtIso: string;
  detectedGarments: DetectedGarment[];
}
