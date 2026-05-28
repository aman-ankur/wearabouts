import type { WardrobeItem } from "@/src/domain/wardrobe";
import type { AvatarPoseId, AvatarRenderQuality } from "./avatarTypes";

export const AVATAR_RENDER_PROMPT_VERSION = "avatar-studio-v1";

interface AvatarRenderPromptInput {
  savedOutfitName: string;
  items: WardrobeItem[];
  poseId: AvatarPoseId;
  quality: AvatarRenderQuality;
}

function itemDescription(item: WardrobeItem): string {
  const details = [
    item.category,
    item.colors?.length ? `colors: ${item.colors.join(", ")}` : null,
    item.pattern ? `pattern: ${item.pattern}` : null,
    item.material ? `material: ${item.material}` : null,
  ].filter(Boolean);

  return `${item.name} (${details.join("; ")})`;
}

export function buildAvatarRenderPrompt(input: AvatarRenderPromptInput): string {
  const pose =
    input.poseId === "studio-front"
      ? "front-facing relaxed standing catalog pose"
      : "slight three-quarter relaxed standing catalog pose";
  const itemList = input.items.length > 0 ? input.items.map(itemDescription).join("; ") : "the provided saved outfit references";

  return [
    `Create one polished full-body Wearabouts Avatar Studio render for the saved outfit "${input.savedOutfitName}".`,
    `Pose: ${pose}. Head, hands, legs, and shoes must be visible.`,
    "Use the face reference for recognizable likeness and the body reference for realistic body proportions, height/width relationship, and broad silhouette.",
    "Prioritize outfit quality: make the selected wardrobe items look naturally worn, well styled, properly fitted, and faithful to their category, colors, patterns, and silhouettes.",
    `Selected wardrobe items: ${itemList}.`,
    "Use a neutral light gray or white studio background with clean catalog lighting.",
    "Do not add extra core garments, shopping items, bags, hats, or accessories that are not in the selected saved outfit.",
    "Do not crop the head or feet. Do not make a pasted-on garment collage. Do not change the user's body into a different person.",
    `Quality target: ${input.quality === "final" ? "high-quality final fashion-catalog image" : "draft-quality preview"}.`,
  ].join(" ");
}
