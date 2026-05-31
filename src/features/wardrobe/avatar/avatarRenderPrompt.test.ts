import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { AVATAR_RENDER_PROMPT_VERSION, buildAvatarRenderPrompt } from "./avatarRenderPrompt";

const item = (id: string, name: string, category: WardrobeItem["category"], extra: Partial<WardrobeItem> = {}): WardrobeItem => ({
  id,
  sourceDetectedGarmentId: `detected-${id}`,
  name,
  brand: "",
  category,
  ownerProfileId: "profile-aankur",
  asset: { id: `asset-${id}`, kind: "prettified", label: name, visualToken: "shirt-striped" },
  addedAtIso: "2026-05-28T10:00:00.000Z",
  readyForMixer: true,
  ...extra,
});

describe("buildAvatarRenderPrompt", () => {
  it("uses a versioned prompt for full-body studio avatar renders", () => {
    const prompt = buildAvatarRenderPrompt({
      savedOutfitName: "Dinner look",
      items: [
        item("shirt", "Striped Shirt", "tops", { colors: ["blue", "white"], pattern: "striped" }),
        item("trousers", "Charcoal Trousers", "bottoms", { colors: ["charcoal"] }),
      ],
      poseId: "studio-three-quarter",
      quality: "final",
    });

    expect(AVATAR_RENDER_PROMPT_VERSION).toBe("avatar-studio-v1.6");
    expect(prompt).toContain("full-body");
    expect(prompt).toContain("neutral light gray or white studio background");
    expect(prompt).toContain("recognizable likeness");
    expect(prompt).toContain("Preserve facial structure, face shape, age, skin tone, hairstyle, facial hair, and natural facial fullness");
    expect(prompt).toContain("body proportions");
    expect(prompt).toContain("natural head-to-body scale");
    expect(prompt).toContain("Prioritize outfit quality");
    expect(prompt).toContain("Striped Shirt");
    expect(prompt).toContain("Do not add extra core garments");
    expect(prompt).toContain("Do not crop the head or feet");
  });

  it("keeps current body and pose while borrowing the old-winner face treatment", () => {
    const prompt = buildAvatarRenderPrompt({
      savedOutfitName: "Soft casual look",
      items: [item("shirt", "Oxford Shirt", "tops")],
      poseId: "studio-three-quarter",
      quality: "final",
    });

    expect(prompt).toContain("Camera and framing: full-body 70-85mm studio catalog perspective");
    expect(prompt).toContain("Use the body reference for realistic body proportions");
    expect(prompt).toContain("slight three-quarter natural fashion-studio pose");
    expect(prompt).toContain("soft natural expression");
    expect(prompt).toContain("same facial structure, face shape, age, skin tone, hairstyle, facial hair, and natural facial fullness");
    expect(prompt).toContain("Do not sharpen the jaw, thin the cheeks, slim the face, change age");
    expect(prompt).not.toContain("relaxed walking catalog pose");
  });

  it("asks for subtle realistic studio polish without changing identity", () => {
    const prompt = buildAvatarRenderPrompt({
      savedOutfitName: "Casual look",
      items: [item("shirt", "Oxford Shirt", "tops")],
      poseId: "studio-front",
      quality: "final",
    });

    expect(prompt).toContain("subtle fashion-catalog lift");
    expect(prompt).toContain("use the full-body reference as the primary person anchor");
    expect(prompt).toContain("Use the face reference only to refine likeness");
    expect(prompt).toContain("Apply restrained studio-photo polish");
    expect(prompt).toContain("natural skin texture");
    expect(prompt).toContain("clearer eyes");
    expect(prompt).toContain("natural facial detail");
    expect(prompt).toContain("render one continuous photograph");
    expect(prompt).toContain("not a face pasted onto a generated dressed body");
    expect(prompt).toContain("Match head angle to torso angle");
    expect(prompt).toContain("align the neck naturally between jaw and shoulders");
    expect(prompt).toContain("match lighting, sharpness, skin tone, and shadow direction");
    expect(prompt).toContain("cleaner neck-to-jaw separation from lighting and posture");
    expect(prompt).toContain("Avoid beauty filters, face slimming, jaw sharpening, longer or more chiseled jaw");
    expect(prompt).toContain("thinner cheeks");
    expect(prompt).toContain("natural fashion-studio pose");
    expect(prompt).toContain("one hand casually in a pocket");
    expect(prompt).toContain("one foot subtly forward");
    expect(prompt).toContain("not passport photo");
    expect(prompt).toContain("not corporate headshot");
    expect(prompt).toContain("not a model makeover");
    expect(prompt).toContain("70-85mm studio catalog perspective");
    expect(prompt).toContain("Improve neck posture, shoulder set, and garment drape");
    expect(prompt).toContain("without making the body taller, slimmer, more muscular");
    expect(prompt).toContain("avoid a basic stiff ID-photo stance");
    expect(prompt).toContain("compressed neck");
    expect(prompt).toContain("rounded shoulders");
    expect(prompt).toContain("subtle natural asymmetry");
  });

  it("allows a modest inferred inner layer when outerwear has no top", () => {
    const prompt = buildAvatarRenderPrompt({
      savedOutfitName: "Jacket look",
      items: [
        item("jacket", "Navy Wool Jacket", "outerwear", { colors: ["navy"] }),
        item("trousers", "Charcoal Trousers", "bottoms", { colors: ["charcoal"] }),
      ],
      poseId: "studio-three-quarter",
      quality: "final",
    });

    expect(prompt).toContain("Base layer exception");
    expect(prompt).toContain("outerwear but no top");
    expect(prompt).toContain("Add one simple, modest inner layer");
    expect(prompt).toContain("plain neutral T-shirt, crewneck, polo, or button-down");
    expect(prompt).toContain("do not replace or hide the selected outerwear");
  });

  it("does not infer an inner layer when a top is already selected", () => {
    const prompt = buildAvatarRenderPrompt({
      savedOutfitName: "Layered look",
      items: [
        item("jacket", "Navy Wool Jacket", "outerwear", { colors: ["navy"] }),
        item("shirt", "White Oxford Shirt", "tops", { colors: ["white"] }),
        item("trousers", "Charcoal Trousers", "bottoms", { colors: ["charcoal"] }),
      ],
      poseId: "studio-three-quarter",
      quality: "final",
    });

    expect(prompt).not.toContain("Base layer exception");
    expect(prompt).toContain("Do not add extra core garments");
  });

  it("does not infer an inner layer when a one-piece outfit is already selected", () => {
    const prompt = buildAvatarRenderPrompt({
      savedOutfitName: "Dress look",
      items: [
        item("dress", "Black Midi Dress", "combo"),
        item("jacket", "Black Blazer", "outerwear"),
      ],
      poseId: "studio-three-quarter",
      quality: "final",
    });

    expect(prompt).not.toContain("Base layer exception");
    expect(prompt).toContain("Do not add extra core garments");
  });
});
