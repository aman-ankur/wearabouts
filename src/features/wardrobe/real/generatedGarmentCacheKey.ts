import type { GarmentBoundingBox, GarmentCategory } from "@/src/domain/wardrobe";

export interface PrettifyCacheConfig {
  promptVersion: string;
  imageModel: string;
  imageQuality: string;
  imageSize: string;
  background: string;
  outputFormat: string;
  inputFidelity: string;
  inputImageMaxDimension: number;
  inputImageFormat: string;
  inputImageQuality: number;
}

export function createGeneratedGarmentCacheKey(input: {
  sourceImageHash: string;
  boundingBox: GarmentBoundingBox;
  category: GarmentCategory;
  config: PrettifyCacheConfig;
}): string {
  const bbox = normalizeBoundingBox(input.boundingBox);

  return [
    `source=${input.sourceImageHash}`,
    `bbox=${bbox.x},${bbox.y},${bbox.width},${bbox.height}`,
    `category=${input.category}`,
    `prompt=${input.config.promptVersion}`,
    `model=${input.config.imageModel}`,
    `quality=${input.config.imageQuality}`,
    `size=${input.config.imageSize}`,
    `background=${input.config.background}`,
    `format=${input.config.outputFormat}`,
    `fidelity=${input.config.inputFidelity}`,
    `input=${input.config.inputImageMaxDimension}:${input.config.inputImageFormat}:${input.config.inputImageQuality}`,
  ].join("|");
}

function normalizeBoundingBox(boundingBox: GarmentBoundingBox): GarmentBoundingBox {
  return {
    x: roundCoordinate(boundingBox.x),
    y: roundCoordinate(boundingBox.y),
    width: roundCoordinate(boundingBox.width),
    height: roundCoordinate(boundingBox.height),
  };
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(4));
}
