import type { AvatarInputKind } from "./avatarTypes";
import type { AvatarStoredInput } from "./avatarTypes";

export const AVATAR_STORAGE_BUCKET = "avatar-assets";
export type AvatarUploadContentType = "image/jpeg" | "image/png" | "image/webp";

export interface AvatarUploadSlot {
  assetId: string;
  bucket: typeof AVATAR_STORAGE_BUCKET;
  contentType: AvatarUploadContentType;
  storagePath: string;
}

const extensions: Record<AvatarUploadContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isSupportedAvatarUploadContentType(value: string): value is AvatarUploadContentType {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp";
}

export function createAvatarUploadSlot(input: {
  householdId: string;
  profileId: string;
  kind: AvatarInputKind;
  contentType: AvatarUploadContentType;
  token: string;
}): AvatarUploadSlot {
  const assetId = `avatar-${input.kind}-${input.token}`;

  return {
    assetId,
    bucket: AVATAR_STORAGE_BUCKET,
    contentType: input.contentType,
    storagePath: `${input.householdId}/${input.profileId}/${assetId}.${extensions[input.contentType]}`,
  };
}

export function isAvatarStoredInputForSlot(input: {
  storedInput: AvatarStoredInput;
  householdId: string;
  profileId: string;
  kind: AvatarInputKind;
}): boolean {
  const prefix = `${input.householdId}/${input.profileId}/avatar-${input.kind}-`;
  const expectedExtension = extensions[input.storedInput.contentType];

  return input.storedInput.assetId.startsWith(`avatar-${input.kind}-`)
    && input.storedInput.storagePath.startsWith(prefix)
    && input.storedInput.storagePath === `${input.householdId}/${input.profileId}/${input.storedInput.assetId}.${expectedExtension}`;
}
