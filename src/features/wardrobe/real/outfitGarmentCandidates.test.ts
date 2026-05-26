import { describe, expect, it } from "vitest";
import {
  createPaddedCropRegion,
  isOutfitCandidatePrettifyEligible,
  planOutfitExtraction,
  summarizeOutfitCandidates,
  type OutfitGarmentCandidateAnalysis,
} from "./outfitGarmentCandidates";
import type { WardrobeItem } from "@/src/domain/wardrobe";

const visibleTop: OutfitGarmentCandidateAnalysis = {
  proposedName: "Blue Denim Overshirt",
  category: "outerwear",
  confidence: "high",
  visibilityState: "visible",
  boundingBox: { x: 0.2, y: 0.1, width: 0.5, height: 0.45 },
  cropPrompt: "outer blue shirt layer",
  shouldPrettify: true,
};

const visibleBottom: OutfitGarmentCandidateAnalysis = {
  proposedName: "Indigo Straight Jeans",
  category: "bottoms",
  confidence: "high",
  visibilityState: "visible",
  boundingBox: { x: 0.26, y: 0.48, width: 0.34, height: 0.42 },
  cropPrompt: "indigo jeans",
  shouldPrettify: true,
};

const visibleShoes: OutfitGarmentCandidateAnalysis = {
  proposedName: "White Sneakers",
  category: "footwear",
  confidence: "high",
  visibilityState: "visible",
  boundingBox: { x: 0.28, y: 0.87, width: 0.26, height: 0.08 },
  cropPrompt: "white sneakers",
  shouldPrettify: true,
};

const visibleWatch: OutfitGarmentCandidateAnalysis = {
  proposedName: "Dark Smartwatch",
  category: "accessories",
  confidence: "high",
  visibilityState: "visible",
  boundingBox: { x: 0.68, y: 0.35, width: 0.06, height: 0.06 },
  cropPrompt: "dark smartwatch",
  shouldPrettify: true,
};

const closetJeans: WardrobeItem = {
  id: "wardrobe-jeans-1",
  sourceDetectedGarmentId: "garment-jeans-1",
  name: "Indigo Straight Jeans",
  brand: "",
  category: "bottoms",
  ownerProfileId: "profile-aankur",
  asset: {
    id: "asset-jeans-1",
    kind: "prettified",
    bucket: "closet-assets",
    storagePath: "demo/jeans.png",
    imageUrl: "https://signed.example/jeans.png",
    label: "Indigo jeans",
  },
  addedAtIso: "2026-05-25T10:00:00.000Z",
  readyForMixer: true,
};

describe("outfitGarmentCandidates", () => {
  it("treats visible high and medium confidence garments as prettify eligible", () => {
    expect(isOutfitCandidatePrettifyEligible(visibleTop)).toBe(true);
    expect(isOutfitCandidatePrettifyEligible({ ...visibleTop, confidence: "medium" })).toBe(true);
  });

  it("does not let a false shouldPrettify flag override visible high-confidence garments", () => {
    expect(isOutfitCandidatePrettifyEligible({ ...visibleTop, shouldPrettify: false })).toBe(true);
  });

  it("skips low confidence or occluded candidates", () => {
    expect(isOutfitCandidatePrettifyEligible({ ...visibleTop, confidence: "low" })).toBe(false);
    expect(isOutfitCandidatePrettifyEligible({ ...visibleTop, visibilityState: "occluded" })).toBe(false);
  });

  it("summarizes candidate outcomes for review context", () => {
    const summary = summarizeOutfitCandidates([
      { status: "ready" },
      { status: "ready" },
      { status: "skipped" },
      { status: "failed" },
      { status: "detected" },
    ]);

    expect(summary).toEqual({
      detectedCount: 5,
      generatedCount: 2,
      skippedCount: 1,
      failedCount: 1,
    });
  });

  it("creates a padded crop region clamped to image bounds", () => {
    const region = createPaddedCropRegion(
      { imageWidth: 1000, imageHeight: 800 },
      { x: 0.85, y: 0.7, width: 0.25, height: 0.4 },
      0.2,
    );

    expect(region).toEqual({
      left: 800,
      top: 496,
      width: 200,
      height: 304,
    });
  });

  it("accepts pixel bounding boxes from model output", () => {
    const region = createPaddedCropRegion(
      { imageWidth: 1000, imageHeight: 1600 },
      { x: 425, y: 1254, width: 263, height: 273 },
      0.2,
    );

    expect(region).toEqual({
      left: 372,
      top: 1199,
      width: 369,
      height: 383,
    });
  });

  it("keeps pick-after-scan candidates selectable without auto-selecting generation", () => {
    const plan = planOutfitExtraction({
      candidates: [visibleTop, visibleBottom, visibleShoes, visibleWatch],
      mode: "pick_after_scan",
      skipExistingItems: true,
      existingClosetItems: [],
    });

    expect(plan.map((item) => [item.proposedName, item.selectionStatus, item.shouldGenerate])).toEqual([
      ["Blue Denim Overshirt", "primary", false],
      ["Indigo Straight Jeans", "primary", false],
      ["White Sneakers", "optional", false],
      ["Dark Smartwatch", "optional", false],
    ]);
  });

  it("selects top and bottom for core outfit but leaves shoes and accessories optional", () => {
    const plan = planOutfitExtraction({
      candidates: [visibleTop, visibleBottom, visibleShoes, visibleWatch],
      mode: "core_outfit",
      skipExistingItems: true,
      existingClosetItems: [],
    });

    expect(plan.map((item) => [item.proposedName, item.selectionStatus, item.shouldGenerate])).toEqual([
      ["Blue Denim Overshirt", "selected", true],
      ["Indigo Straight Jeans", "selected", true],
      ["White Sneakers", "optional", false],
      ["Dark Smartwatch", "optional", false],
    ]);
  });

  it("uses new-tops mode to avoid regenerating repeated jeans", () => {
    const plan = planOutfitExtraction({
      candidates: [visibleTop, visibleBottom, visibleShoes],
      mode: "new_tops",
      skipExistingItems: true,
      existingClosetItems: [closetJeans],
    });

    expect(plan.map((item) => [item.proposedName, item.selectionStatus, item.duplicateHint, item.shouldGenerate])).toEqual([
      ["Blue Denim Overshirt", "selected", false, true],
      ["Indigo Straight Jeans", "skipped_existing", true, false],
      ["White Sneakers", "optional", false, false],
    ]);
  });

  it("lets duplicate hints suppress defaults without making candidates unselectable", () => {
    const plan = planOutfitExtraction({
      candidates: [visibleBottom],
      mode: "new_bottoms",
      skipExistingItems: true,
      existingClosetItems: [closetJeans],
    });

    expect(plan[0]).toMatchObject({
      proposedName: "Indigo Straight Jeans",
      selectionStatus: "skipped_existing",
      duplicateHint: true,
      shouldGenerate: false,
      selectable: true,
    });
  });
});
