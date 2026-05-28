import type { SavedOutfit } from "@/src/domain/wardrobe";
import { AVATAR_RENDER_PROMPT_VERSION } from "./avatarRenderPrompt";
import type { AvatarPoseId, AvatarProfile, AvatarRenderQuality, AvatarRenderRequest } from "./avatarTypes";

interface CreateAvatarRenderRequestInput {
  avatarProfile: AvatarProfile | null;
  savedOutfit: SavedOutfit;
  poseId?: AvatarPoseId;
  quality?: AvatarRenderQuality;
  promptVersion?: string;
}

export function createAvatarRenderRequest(input: CreateAvatarRenderRequestInput): AvatarRenderRequest {
  if (!input.avatarProfile) {
    throw new Error("Avatar profile is required to render a preview.");
  }

  const wardrobeItemIds = input.savedOutfit.selections
    .map((selection) => selection.wardrobeItemId)
    .filter((wardrobeItemId): wardrobeItemId is string => Boolean(wardrobeItemId));

  if (wardrobeItemIds.length === 0) {
    throw new Error("Saved outfit has no wardrobe items to render.");
  }

  return {
    avatarProfileId: input.avatarProfile.id,
    savedOutfitId: input.savedOutfit.id,
    wardrobeItemIds,
    poseId: input.poseId ?? "studio-three-quarter",
    quality: input.quality ?? "final",
    promptVersion: input.promptVersion ?? AVATAR_RENDER_PROMPT_VERSION,
  };
}
