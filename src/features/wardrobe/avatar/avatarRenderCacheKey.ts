import type { AvatarRenderRequest } from "./avatarTypes";

export function createAvatarRenderCacheKey(request: AvatarRenderRequest): string {
  return [
    "avatar",
    request.avatarProfileId,
    "outfit",
    request.savedOutfitId,
    "items",
    [...request.wardrobeItemIds].sort().join(","),
    "pose",
    request.poseId,
    "quality",
    request.quality,
    "prompt",
    request.promptVersion,
  ].join(":");
}
