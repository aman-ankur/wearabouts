import type { SavedOutfit, WardrobeItem } from "@/src/domain/wardrobe";
import type { AvatarProfile, AvatarRenderRequest, AvatarRenderStatus } from "./avatarTypes";

export interface AvatarRenderProviderRequest {
  request: AvatarRenderRequest;
  avatarProfile: AvatarProfile;
  savedOutfit: SavedOutfit;
  wardrobeItems: WardrobeItem[];
  prompt: string;
  cacheKey: string;
  forceRegenerate?: boolean;
  faceImageUrl?: string;
  bodyImageUrl?: string;
}

export interface AvatarRenderProviderResult {
  status: Extract<AvatarRenderStatus, "ready" | "failed">;
  imageUrl?: string;
  imageAssetId?: string;
  qualityNotes: string[];
}

export interface AvatarRenderProvider {
  renderAvatar(request: AvatarRenderProviderRequest): Promise<AvatarRenderProviderResult>;
}

export function withAvatarProfileReferenceImages(
  request: AvatarRenderProviderRequest,
  references: Pick<AvatarRenderProviderRequest, "faceImageUrl" | "bodyImageUrl">,
): AvatarRenderProviderRequest {
  return {
    ...request,
    faceImageUrl: references.faceImageUrl ?? request.faceImageUrl,
    bodyImageUrl: references.bodyImageUrl ?? request.bodyImageUrl,
  };
}
