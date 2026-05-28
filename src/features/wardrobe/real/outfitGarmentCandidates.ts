import sharp from "sharp";
import type { ConfidenceLevel, GarmentCategory, WardrobeItem } from "@/src/domain/wardrobe";

export type GarmentVisibilityState = "visible" | "occluded" | "needs_review";
export type GarmentCandidateStatus = "detected" | "skipped" | "prettifying" | "ready" | "failed";
export type OutfitExtractionMode = "pick_after_scan" | "new_tops" | "new_bottoms" | "core_outfit";
export type CandidateSelectionStatus =
  | "primary"
  | "optional"
  | "skipped_existing"
  | "not_recommended"
  | "selected";

export interface NormalizedBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OutfitGarmentCandidateAnalysis {
  proposedName: string;
  category: GarmentCategory;
  confidence: ConfidenceLevel;
  visibilityState: GarmentVisibilityState;
  boundingBox: NormalizedBoundingBox;
  cropPrompt: string;
  shouldPrettify: boolean;
  reason?: string;
}

export interface CropRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CandidateSummaryInput {
  status: GarmentCandidateStatus;
}

export interface OutfitCandidateSummary {
  detectedCount: number;
  generatedCount: number;
  skippedCount: number;
  failedCount: number;
}

export interface PlannedOutfitCandidate extends OutfitGarmentCandidateAnalysis {
  selectionStatus: CandidateSelectionStatus;
  selectionReason: string;
  duplicateHint: boolean;
  shouldGenerate: boolean;
  selectable: boolean;
}

export interface OutfitExtractionPlanInput {
  candidates: OutfitGarmentCandidateAnalysis[];
  mode: OutfitExtractionMode;
  skipExistingItems: boolean;
  existingClosetItems: WardrobeItem[];
}

export function isOutfitCandidatePrettifyEligible(candidate: OutfitGarmentCandidateAnalysis): boolean {
  return (
    candidate.visibilityState !== "occluded" &&
    (candidate.confidence === "high" || candidate.confidence === "medium")
  );
}

export function summarizeOutfitCandidates(candidates: CandidateSummaryInput[]): OutfitCandidateSummary {
  return {
    detectedCount: candidates.length,
    generatedCount: candidates.filter((candidate) => candidate.status === "ready").length,
    skippedCount: candidates.filter((candidate) => candidate.status === "skipped").length,
    failedCount: candidates.filter((candidate) => candidate.status === "failed").length,
  };
}

export function planOutfitExtraction(input: OutfitExtractionPlanInput): PlannedOutfitCandidate[] {
  const planned = input.candidates.map((candidate) => {
    const duplicateHint = input.skipExistingItems && hasLikelyClosetDuplicate(candidate, input.existingClosetItems);
    const selectable = candidate.visibilityState !== "occluded" && candidate.confidence !== "low";
    const selectionStatus = getDefaultSelectionStatus(candidate, duplicateHint, selectable);

    return {
      ...candidate,
      selectionStatus,
      selectionReason: getSelectionReason(candidate, selectionStatus, duplicateHint),
      duplicateHint,
      shouldGenerate: false,
      selectable,
    };
  });

  const selectableNewCandidates = planned.filter(
    (candidate) => candidate.selectable && candidate.selectionStatus !== "skipped_existing",
  );

  if (input.mode === "pick_after_scan") {
    return planned;
  }

  const selectedIds = new Set<string>();
  if (input.mode === "core_outfit") {
    const top = getBestCandidate(selectableNewCandidates.filter(isUpperBodyCandidate));
    const bottom = getBestCandidate(selectableNewCandidates.filter((candidate) => candidate.category === "bottoms"));
    if (top) {
      selectedIds.add(getCandidateKey(top));
    }
    if (bottom) {
      selectedIds.add(getCandidateKey(bottom));
    }
  }

  if (input.mode === "new_tops") {
    for (const candidate of selectableNewCandidates.filter(isUpperBodyCandidate)) {
      selectedIds.add(getCandidateKey(candidate));
    }
  }

  if (input.mode === "new_bottoms") {
    for (const candidate of selectableNewCandidates.filter((candidate) => candidate.category === "bottoms")) {
      selectedIds.add(getCandidateKey(candidate));
    }
  }

  return planned.map((candidate) =>
    selectedIds.has(getCandidateKey(candidate))
      ? {
          ...candidate,
          selectionStatus: "selected",
          selectionReason: "Selected for preparation",
          shouldGenerate: true,
        }
      : candidate,
  );
}

function getDefaultSelectionStatus(
  candidate: OutfitGarmentCandidateAnalysis,
  duplicateHint: boolean,
  selectable: boolean,
): CandidateSelectionStatus {
  if (!selectable) {
    return "not_recommended";
  }
  if (duplicateHint) {
    return "skipped_existing";
  }
  if (candidate.category === "tops" || candidate.category === "outerwear" || candidate.category === "bottoms") {
    return "primary";
  }

  return "optional";
}

function getSelectionReason(
  candidate: OutfitGarmentCandidateAnalysis,
  status: CandidateSelectionStatus,
  duplicateHint: boolean,
): string {
  if (duplicateHint) {
    return "Looks like an item already in Wardrobe";
  }
  if (status === "not_recommended") {
    return candidate.visibilityState === "occluded" ? "Not enough of this item is visible" : "Needs a clearer photo";
  }
  if (status === "optional") {
    return candidate.category === "footwear" ? "Shoes are optional for this upload" : "Accessory saved as optional";
  }

  return "Clear clothing item";
}

function hasLikelyClosetDuplicate(candidate: OutfitGarmentCandidateAnalysis, closetItems: WardrobeItem[]): boolean {
  const candidateWords = normalizeName(candidate.proposedName);
  return closetItems.some((item) => {
    if (item.category !== candidate.category) {
      return false;
    }

    const itemWords = normalizeName(item.name);
    const overlap = candidateWords.filter((word) => itemWords.includes(word));
    return overlap.length >= Math.min(2, candidateWords.length);
  });
}

function normalizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function isUpperBodyCandidate(candidate: OutfitGarmentCandidateAnalysis): boolean {
  return candidate.category === "tops" || candidate.category === "outerwear";
}

function getBestCandidate(candidates: PlannedOutfitCandidate[]): PlannedOutfitCandidate | null {
  return [...candidates].sort((left, right) => getCandidateScore(right) - getCandidateScore(left))[0] ?? null;
}

function getCandidateScore(candidate: PlannedOutfitCandidate): number {
  const confidenceScore = candidate.confidence === "high" ? 30 : candidate.confidence === "medium" ? 18 : 0;
  const visibilityScore = candidate.visibilityState === "visible" ? 20 : candidate.visibilityState === "needs_review" ? 8 : 0;
  const categoryScore = candidate.category === "footwear" ? 8 : candidate.category === "accessories" ? 2 : 16;
  return confidenceScore + visibilityScore + categoryScore + candidate.boundingBox.width * candidate.boundingBox.height * 100;
}

function getCandidateKey(candidate: OutfitGarmentCandidateAnalysis): string {
  return `${candidate.proposedName}:${candidate.category}:${candidate.boundingBox.x}:${candidate.boundingBox.y}`;
}

export function createPaddedCropRegion(
  dimensions: { imageWidth: number; imageHeight: number },
  boundingBox: NormalizedBoundingBox,
  paddingRatio = 0.18,
): CropRegion {
  const isPixelBox =
    boundingBox.x > 1 || boundingBox.y > 1 || boundingBox.width > 1 || boundingBox.height > 1;
  const boxLeft = isPixelBox ? boundingBox.x : boundingBox.x * dimensions.imageWidth;
  const boxTop = isPixelBox ? boundingBox.y : boundingBox.y * dimensions.imageHeight;
  const boxWidth = isPixelBox ? boundingBox.width : boundingBox.width * dimensions.imageWidth;
  const boxHeight = isPixelBox ? boundingBox.height : boundingBox.height * dimensions.imageHeight;
  const paddingX = boxWidth * paddingRatio;
  const paddingY = boxHeight * paddingRatio;

  const left = Math.max(0, Math.floor(boxLeft - paddingX));
  const top = Math.max(0, Math.floor(boxTop - paddingY));
  const right = Math.min(dimensions.imageWidth, Math.ceil(boxLeft + boxWidth + paddingX));
  const bottom = Math.min(dimensions.imageHeight, Math.ceil(boxTop + boxHeight + paddingY));

  return {
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

export function createCandidateCropRegion(
  dimensions: { imageWidth: number; imageHeight: number },
  boundingBox: NormalizedBoundingBox,
  category: GarmentCategory,
): CropRegion {
  return createPaddedCropRegion(dimensions, boundingBox, getCandidateCropPaddingRatio(category));
}

export async function cropGarmentCandidateImage(
  bytes: Uint8Array,
  boundingBox: NormalizedBoundingBox,
  options: { category?: GarmentCategory } = {},
): Promise<Uint8Array> {
  const buffer = await sharp(Buffer.from(bytes)).rotate().png().toBuffer();
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read outfit image dimensions.");
  }

  const region = options.category
    ? createCandidateCropRegion(
        { imageWidth: metadata.width, imageHeight: metadata.height },
        boundingBox,
        options.category,
      )
    : createPaddedCropRegion(
        { imageWidth: metadata.width, imageHeight: metadata.height },
        boundingBox,
      );
  const cropped = await sharp(buffer).extract(region).png().toBuffer();
  return new Uint8Array(cropped);
}

function getCandidateCropPaddingRatio(category: GarmentCategory): number {
  if (category === "bottoms") {
    return 0.35;
  }

  if (category === "footwear") {
    return 0.42;
  }

  if (category === "tops" || category === "outerwear") {
    return 0.28;
  }

  return 0.3;
}
