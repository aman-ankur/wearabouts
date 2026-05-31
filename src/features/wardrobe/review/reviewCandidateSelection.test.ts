import { describe, expect, it } from "vitest";
import type { GarmentCandidateChoice } from "@/src/domain/wardrobe";
import {
  getDefaultSelectedReviewCandidateIds,
  getReviewCandidateStatusMessage,
  shouldShowReviewCandidatePicker,
} from "./reviewCandidateSelection";

function candidate(overrides: Partial<GarmentCandidateChoice>): GarmentCandidateChoice {
  return {
    id: overrides.id ?? "candidate-1",
    uploadBatchId: "batch-1",
    proposedName: overrides.proposedName ?? "White Sneakers",
    category: overrides.category ?? "footwear",
    confidence: overrides.confidence ?? "high",
    visibilityState: overrides.visibilityState ?? "visible",
    boundingBox: overrides.boundingBox ?? { x: 0.1, y: 0.2, width: 0.4, height: 0.5 },
    selectionStatus: overrides.selectionStatus ?? "optional",
    selectionReason: overrides.selectionReason ?? "Shoes are optional for this upload",
    duplicateHint: overrides.duplicateHint ?? false,
    status: overrides.status ?? "detected",
    errorMessage: overrides.errorMessage ?? null,
    detectedGarmentId: overrides.detectedGarmentId ?? null,
  };
}

describe("reviewCandidateSelection", () => {
  it("shows the picker for optional-only candidates so one-item photos do not look complete", () => {
    const candidates = [candidate({ id: "shoes", selectionStatus: "optional" })];

    expect(shouldShowReviewCandidatePicker({ isPersistentMode: true, isOutfitBatch: true, garmentCount: 0, candidates })).toBe(true);
    expect(getDefaultSelectedReviewCandidateIds(candidates)).toEqual(["shoes"]);
  });

  it("keeps duplicate and not-recommended candidates visible without selecting them by default", () => {
    const candidates = [
      candidate({ id: "duplicate", selectionStatus: "skipped_existing" }),
      candidate({ id: "unclear", selectionStatus: "not_recommended", confidence: "low" }),
    ];

    expect(shouldShowReviewCandidatePicker({ isPersistentMode: true, isOutfitBatch: true, garmentCount: 0, candidates })).toBe(true);
    expect(getDefaultSelectedReviewCandidateIds(candidates)).toEqual([]);
  });

  it("explains provider safety rejections without exposing raw API errors", () => {
    expect(
      getReviewCandidateStatusMessage(
        candidate({
          status: "failed",
          errorMessage: "400 Your request was rejected by the safety system. safety_violations=[sexual].",
        }),
      ),
    ).toBe("Wearabouts could not generate this item because the image provider blocked it with a safety filter.");
  });
});
