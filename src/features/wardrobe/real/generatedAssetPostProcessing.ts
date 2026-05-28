import type { ImageBackgroundRemovalAnalysis } from "./imageBackgroundRemoval";
import { removeGeneratedAssetBackground } from "./imageBackgroundRemoval";
import {
  analyzeImageTransparency,
  getTransparencyQualityNotes,
  type ImageTransparencyAnalysis,
} from "./imageTransparencyValidation";

export type BackgroundCleanupTelemetry =
  | ({ applied: true } & ImageBackgroundRemovalAnalysis)
  | { applied: false; reason: "alpha_present" | "no_safe_generated_background" };

export interface GeneratedAssetPostProcessingResult {
  bytes: Uint8Array;
  transparency: ImageTransparencyAnalysis;
  backgroundCleanup: BackgroundCleanupTelemetry;
  qualityNotes: string[];
}

const usableAlphaTransparentRatio = 0.08;
const meaningfulCleanupRatio = 0.02;

export async function prepareGeneratedWardrobeAsset(bytes: Uint8Array): Promise<GeneratedAssetPostProcessingResult> {
  const initialTransparency = await analyzeImageTransparency(bytes);
  if (initialTransparency.hasAlphaChannel && initialTransparency.transparentPixelRatio >= usableAlphaTransparentRatio) {
    return {
      bytes,
      transparency: initialTransparency,
      backgroundCleanup: { applied: false, reason: "alpha_present" },
      qualityNotes: getTransparencyQualityNotes(initialTransparency),
    };
  }

  const cleaned = await removeGeneratedAssetBackground(bytes);
  if (cleaned.analysis.removedPixelRatio >= meaningfulCleanupRatio) {
    const transparency = await analyzeImageTransparency(cleaned.bytes);
    return {
      bytes: cleaned.bytes,
      transparency,
      backgroundCleanup: { applied: true, ...cleaned.analysis },
      qualityNotes: [...cleaned.qualityNotes, ...getTransparencyQualityNotes(transparency)],
    };
  }

  return {
    bytes,
    transparency: initialTransparency,
    backgroundCleanup: { applied: false, reason: "no_safe_generated_background" },
    qualityNotes: [
      ...getTransparencyQualityNotes(initialTransparency),
      "Skipped unsafe background cleanup so light garment details are preserved for review.",
    ],
  };
}
