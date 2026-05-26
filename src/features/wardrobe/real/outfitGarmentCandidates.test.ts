import { describe, expect, it } from "vitest";
import {
  createPaddedCropRegion,
  isOutfitCandidatePrettifyEligible,
  summarizeOutfitCandidates,
  type OutfitGarmentCandidateAnalysis,
} from "./outfitGarmentCandidates";

const visibleTop: OutfitGarmentCandidateAnalysis = {
  proposedName: "Blue Denim Overshirt",
  category: "outerwear",
  confidence: "high",
  visibilityState: "visible",
  boundingBox: { x: 0.2, y: 0.1, width: 0.5, height: 0.45 },
  cropPrompt: "outer blue shirt layer",
  shouldPrettify: true,
};

describe("outfitGarmentCandidates", () => {
  it("treats visible high and medium confidence garments as prettify eligible", () => {
    expect(isOutfitCandidatePrettifyEligible(visibleTop)).toBe(true);
    expect(isOutfitCandidatePrettifyEligible({ ...visibleTop, confidence: "medium" })).toBe(true);
  });

  it("skips low confidence, occluded, or explicitly rejected candidates", () => {
    expect(isOutfitCandidatePrettifyEligible({ ...visibleTop, confidence: "low" })).toBe(false);
    expect(isOutfitCandidatePrettifyEligible({ ...visibleTop, visibilityState: "occluded" })).toBe(false);
    expect(isOutfitCandidatePrettifyEligible({ ...visibleTop, shouldPrettify: false })).toBe(false);
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
});
