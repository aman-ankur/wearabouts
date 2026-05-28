import type { AvatarProfile } from "./avatarTypes";

export type AvatarProfileResponse = Omit<AvatarProfile, "faceImageUrl" | "bodyImageUrl">;

export function toAvatarProfileResponse(profile: AvatarProfile | null): AvatarProfileResponse | null {
  if (!profile) return null;

  return {
    id: profile.id,
    profileId: profile.profileId,
    faceAssetId: profile.faceAssetId,
    bodyAssetId: profile.bodyAssetId,
    faceQuality: profile.faceQuality,
    bodyQuality: profile.bodyQuality,
    createdAtIso: profile.createdAtIso,
    updatedAtIso: profile.updatedAtIso,
  };
}
