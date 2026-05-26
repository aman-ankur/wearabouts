import sharp from "sharp";

export interface NormalizedOpenAIImage {
  bytes: Uint8Array;
  contentType: "image/png";
  filename: string;
}

export async function normalizeImageForOpenAI(bytes: Uint8Array): Promise<NormalizedOpenAIImage> {
  const buffer = await sharp(Buffer.from(bytes), { failOn: "none" })
    .rotate()
    .toColorspace("srgb")
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  return {
    bytes: new Uint8Array(buffer),
    contentType: "image/png",
    filename: "wearabouts-openai-source.png",
  };
}
