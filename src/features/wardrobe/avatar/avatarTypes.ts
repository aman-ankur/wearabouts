import type { SavedOutfit, WardrobeItem, WardrobeProfileId } from "@/src/domain/wardrobe";

export type AvatarInputKind = "face" | "body";

export type AvatarInputQualityStatus = "pending" | "passed" | "warning" | "failed";

export interface AvatarInputQualityCheck {
  status: AvatarInputQualityStatus;
  reasons: string[];
  detectedPersonCount?: number;
  faceVisible?: boolean;
  fullBodyVisible?: boolean;
}

export interface AvatarProfile {
  id: string;
  profileId: WardrobeProfileId;
  faceAssetId: string;
  bodyAssetId: string;
  faceImageUrl?: string;
  bodyImageUrl?: string;
  faceQuality: AvatarInputQualityCheck;
  bodyQuality: AvatarInputQualityCheck;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface AvatarStoredInput {
  assetId: string;
  storagePath: string;
  contentType: "image/png" | "image/jpeg" | "image/webp";
}

export type AvatarPoseId = "studio-front" | "studio-three-quarter";
export type AvatarRenderQuality = "draft" | "final";
export type AvatarRenderStatus = "queued" | "rendering" | "ready" | "failed" | "deleted";

export interface AvatarRenderRequest {
  avatarProfileId: string;
  savedOutfitId: string;
  wardrobeItemIds: string[];
  poseId: AvatarPoseId;
  quality: AvatarRenderQuality;
  promptVersion: string;
}

export interface AvatarRender {
  id: string;
  request: AvatarRenderRequest;
  cacheKey: string;
  status: AvatarRenderStatus;
  imageAssetId?: string;
  imageUrl?: string;
  qualityNotes: string[];
  createdAtIso: string;
  updatedAtIso?: string;
  deletedAtIso?: string;
}

export interface AvatarRenderSourceBundle {
  avatarProfile: AvatarProfile;
  savedOutfit: SavedOutfit;
  wardrobeItems: WardrobeItem[];
  faceImageUrl?: string;
  bodyImageUrl?: string;
}
