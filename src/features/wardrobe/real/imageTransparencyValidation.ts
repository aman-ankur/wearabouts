import sharp from "sharp";

export interface ImageTransparencyAnalysis {
  hasAlphaChannel: boolean;
  hasTransparentPixels: boolean;
  transparentPixelRatio: number;
  alphaMin?: number;
  alphaMax?: number;
}

export async function analyzeImageTransparency(bytes: Uint8Array): Promise<ImageTransparencyAnalysis> {
  const image = sharp(Buffer.from(bytes), { failOn: "none" });
  const metadata = await image.metadata();
  const hasAlphaChannel = metadata.hasAlpha === true;

  if (!hasAlphaChannel) {
    return {
      hasAlphaChannel: false,
      hasTransparentPixels: false,
      transparentPixelRatio: 0,
    };
  }

  const { data, info } = await sharp(Buffer.from(bytes), { failOn: "none" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channelCount = info.channels;
  const alphaChannelOffset = channelCount - 1;
  let transparentPixels = 0;
  let alphaMin = 255;
  let alphaMax = 0;

  for (let index = alphaChannelOffset; index < data.length; index += channelCount) {
    const alpha = data[index];
    alphaMin = Math.min(alphaMin, alpha);
    alphaMax = Math.max(alphaMax, alpha);
    if (alpha < 250) {
      transparentPixels += 1;
    }
  }

  const pixelCount = Math.max(info.width * info.height, 1);
  const transparentPixelRatio = transparentPixels / pixelCount;

  return {
    hasAlphaChannel,
    hasTransparentPixels: transparentPixels > 0,
    transparentPixelRatio,
    alphaMin,
    alphaMax,
  };
}

export function getTransparencyQualityNotes(analysis: ImageTransparencyAnalysis): string[] {
  if (analysis.hasAlphaChannel && analysis.hasTransparentPixels) {
    return ["Generated transparent PNG cutout with alpha channel."];
  }

  if (analysis.hasAlphaChannel) {
    return ["Generated PNG includes alpha channel but no transparent pixels were detected."];
  }

  return ["Generated PNG has no transparent alpha; keeping asset for review on the white outfit board."];
}
