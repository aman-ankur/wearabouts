import type { WardrobeItem } from "@/src/domain/wardrobe";
import type { AvatarPoseId, AvatarRenderQuality } from "./avatarTypes";

export const AVATAR_RENDER_PROMPT_VERSION = "avatar-studio-v1.3";

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

function baseLayerInstruction(items: WardrobeItem[]): string {
  const hasTop = items.some((item) => item.category === "tops");
  const hasOuterwear = items.some((item) => item.category === "outerwear");

  if (!hasOuterwear || hasTop) {
    return "Do not add extra core garments, shopping items, bags, hats, or accessories that are not in the selected saved outfit.";
  }

  return [
    "Base layer exception: the selected outfit includes outerwear but no top.",
    "Add one simple, modest inner layer under the outerwear so the person is not bare-chested: choose a plain neutral T-shirt, crewneck, polo, or button-down that suits the outerwear and bottoms.",
    "Keep this inferred inner layer understated and partially secondary; do not make it the hero item, do not add logos or loud patterns, and do not replace or hide the selected outerwear.",
    "Apart from this necessary inner layer, do not add extra core garments, shopping items, bags, hats, or accessories that are not in the selected saved outfit.",
  ].join(" ");
}

export function buildAvatarRenderPrompt(input: AvatarRenderPromptInput): string {
  const pose =
    input.poseId === "studio-front"
      ? "front-facing natural studio catalog pose with relaxed confidence, even shoulders, one hand casually in a pocket when compatible with the outfit, and subtle weight through one leg"
      : "slight three-quarter natural studio catalog pose with relaxed confidence, torso angled a little from camera, head naturally turned, one hand casually in a pocket when compatible with the outfit, and subtle weight through one leg";
  const itemList = input.items.length > 0 ? input.items.map(itemDescription).join("; ") : "the provided saved outfit references";

  return [
    `Create one polished full-body Wearabouts Avatar Studio render for the saved outfit "${input.savedOutfitName}".`,
    `Pose: ${pose}. Head, hands, legs, and shoes must be visible.`,
    "Style direction: realistic accurate studio person with light fashion-catalog polish, not passport photo, not corporate headshot, not casual snapshot, not a model makeover.",
    "Camera and framing: full-body 70-85mm studio catalog perspective, camera at upper-torso height, natural vertical proportions, generous neutral background around the person, feet grounded, no wide-angle distortion.",
    "Face direction: use the face reference for recognizable likeness and keep the same person. Preserve facial structure, face shape, age, skin tone, hairstyle, facial hair, and natural facial fullness; allow only a calmer composed expression if the source smile or blink looks awkward.",
    "Apply restrained studio-photo polish through lighting and focus: smoother even lighting, natural skin texture, clearer eyes, natural facial detail, groomed hair definition, and reduced harsh shadows.",
    "Avoid beauty filters, face slimming, jaw sharpening, longer or more chiseled jaw, symmetry changes, younger-looking face, airbrushed skin, plastic skin, or making the person look like someone else.",
    "Use the body reference for realistic body proportions, height/width relationship, broad silhouette, and natural head-to-body scale. Improve posture and garment drape without making the body taller, slimmer, more muscular, enlarged, or reshaped.",
    "Prioritize outfit quality: make the selected wardrobe items look naturally worn, contemporary, neatly styled, properly fitted to the person's real body, and faithful to their category, colors, patterns, and silhouettes.",
    "Render crisp garment construction details such as collars, seams, waistbands, hems, cuffs, shoe shape, texture, and pattern alignment when present in the references.",
    `Selected wardrobe items: ${itemList}.`,
    "Use a neutral light gray or white studio background with soft premium catalog lighting, subtle floor contact shadow, and no environmental props.",
    baseLayerInstruction(input.items),
    "Do not crop the head or feet. Do not use a stiff arms-straight pose unless the selected pose requires it. Do not make a pasted-on garment collage. Do not change the user's face or body into a different person.",
    `Quality target: ${input.quality === "final" ? "high-quality final fashion-catalog image" : "draft-quality preview"}.`,
  ].join(" ");
}
