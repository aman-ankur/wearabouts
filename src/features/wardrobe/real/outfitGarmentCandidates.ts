import sharp from "sharp";
import type { ConfidenceLevel, GarmentCategory } from "@/src/domain/wardrobe";

export type GarmentVisibilityState = "visible" | "occluded" | "needs_review";
export type GarmentCandidateStatus = "detected" | "skipped" | "prettifying" | "ready" | "failed";

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

export function isOutfitCandidatePrettifyEligible(candidate: OutfitGarmentCandidateAnalysis): boolean {
  return (
    candidate.shouldPrettify &&
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

export function createPaddedCropRegion(
  dimensions: { imageWidth: number; imageHeight: number },
  boundingBox: NormalizedBoundingBox,
  paddingRatio = 0.18,
): CropRegion {
  const boxLeft = boundingBox.x * dimensions.imageWidth;
  const boxTop = boundingBox.y * dimensions.imageHeight;
  const boxWidth = boundingBox.width * dimensions.imageWidth;
  const boxHeight = boundingBox.height * dimensions.imageHeight;
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

export async function cropGarmentCandidateImage(
  bytes: Uint8Array,
  boundingBox: NormalizedBoundingBox,
): Promise<Uint8Array> {
  const buffer = await sharp(Buffer.from(bytes)).rotate().png().toBuffer();
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read outfit image dimensions.");
  }

  const region = createPaddedCropRegion(
    { imageWidth: metadata.width, imageHeight: metadata.height },
    boundingBox,
  );
  const cropped = await sharp(buffer).extract(region).png().toBuffer();
  return new Uint8Array(cropped);
}
