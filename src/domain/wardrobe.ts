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

export type OutfitSlot = "top" | "bottom" | "shoes" | "layer" | "accessory";

export interface OutfitSlotSelection {
  slot: OutfitSlot;
  wardrobeItemId: string | null;
  locked: boolean;
}

export interface SavedOutfit {
  id: string;
  name: string;
  profileId: WardrobeProfileId;
  selections: OutfitSlotSelection[];
  createdAtIso: string;
}

export interface MixerBodyPreview {
  id: string;
  profileId: WardrobeProfileId;
  label: string;
  visualToken: "body-demo-aankur";
}

export type TripStyleMode = "minimal" | "balanced" | "style_first";

export type TripLookStatus = "suggested" | "approved";

export interface TripDay {
  id: string;
  label: string;
  dateLabel: string;
  activity: string;
}

export interface TripLook {
  id: string;
  tripDayId: string;
  title: string;
  note: string;
  status: TripLookStatus;
  selections: OutfitSlotSelection[];
}

export interface DemoTrip {
  id: string;
  destination: string;
  dateRangeLabel: string;
  profileId: WardrobeProfileId;
  styleMode: TripStyleMode;
  baggageMode: "carry_on";
  days: TripDay[];
  note: string;
}

export interface PackingListItem {
  wardrobeItemId: string;
  wearCount: number;
}

export interface UploadBatch {
  id: string;
  sourceType: UploadSourceType;
  title: string;
  createdAtIso: string;
  detectedGarments: DetectedGarment[];
}
