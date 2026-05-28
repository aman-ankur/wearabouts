import sharp from "sharp";

export interface ImageBackgroundRemovalAnalysis {
  width: number;
  height: number;
  removedPixelRatio: number;
  removedPixelCount: number;
}

export interface ImageBackgroundRemovalResult {
  bytes: Uint8Array;
  analysis: ImageBackgroundRemovalAnalysis;
  qualityNotes: string[];
}

const alphaTransparentThreshold = 250;

export async function removeGeneratedAssetBackground(bytes: Uint8Array): Promise<ImageBackgroundRemovalResult> {
  const image = sharp(Buffer.from(bytes), { failOn: "none" }).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const removable = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let queueStart = 0;
  let queueEnd = 0;

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const offset = pixelIndex * 4;
    removable[pixelIndex] = isLikelyGeneratedBackground(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])
      ? 1
      : 0;
  }

  const enqueue = (pixelIndex: number) => {
    if (visited[pixelIndex] || !removable[pixelIndex]) {
      return;
    }

    visited[pixelIndex] = 1;
    queue[queueEnd] = pixelIndex;
    queueEnd += 1;
  };

  for (let x = 0; x < info.width; x += 1) {
    enqueue(x);
    enqueue((info.height - 1) * info.width + x);
  }

  for (let y = 0; y < info.height; y += 1) {
    enqueue(y * info.width);
    enqueue(y * info.width + info.width - 1);
  }

  while (queueStart < queueEnd) {
    const pixelIndex = queue[queueStart];
    queueStart += 1;
    const x = pixelIndex % info.width;
    const y = Math.floor(pixelIndex / info.width);

    if (x > 0) enqueue(pixelIndex - 1);
    if (x < info.width - 1) enqueue(pixelIndex + 1);
    if (y > 0) enqueue(pixelIndex - info.width);
    if (y < info.height - 1) enqueue(pixelIndex + info.width);
  }

  let removedPixelCount = 0;
  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (!visited[pixelIndex]) {
      continue;
    }

    removedPixelCount += 1;
    data[pixelIndex * 4 + 3] = 0;
  }

  const removedPixelRatio = removedPixelCount / Math.max(pixelCount, 1);
  const output = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  return {
    bytes: new Uint8Array(output),
    analysis: {
      width: info.width,
      height: info.height,
      removedPixelRatio,
      removedPixelCount,
    },
    qualityNotes:
      removedPixelRatio > 0.02
        ? ["Removed connected generated background so the garment can sit directly on the styling board."]
        : [],
  };
}

function isLikelyGeneratedBackground(red: number, green: number, blue: number, alpha: number) {
  if (alpha < alphaTransparentThreshold) {
    return true;
  }

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;
  const average = (red + green + blue) / 3;

  return average >= 190 && chroma <= 42;
}
