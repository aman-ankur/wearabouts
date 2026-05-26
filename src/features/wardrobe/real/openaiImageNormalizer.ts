import sharp from "sharp";

export interface NormalizedOpenAIImage {
  bytes: Uint8Array;
  contentType: "image/png" | "image/jpeg" | "image/webp";
  filename: string;
  width: number;
  height: number;
}

export interface OpenAIImageNormalizationOptions {
  maxDimension?: number;
  format?: "png" | "jpeg" | "webp";
  quality?: number;
  filenamePrefix?: string;
}

export async function normalizeImageForOpenAI(
  bytes: Uint8Array,
  options: OpenAIImageNormalizationOptions = {},
): Promise<NormalizedOpenAIImage> {
  const format = options.format ?? "png";
  const maxDimension = options.maxDimension ?? 1600;
  const pipeline = sharp(Buffer.from(bytes), { failOn: "none" })
    .rotate()
    .toColorspace("srgb")
    .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true });
  const output = await encodeImage(pipeline, format, options.quality).toBuffer({ resolveWithObject: true });

  return {
    bytes: new Uint8Array(output.data),
    contentType: getContentType(format),
    filename: `${options.filenamePrefix ?? "wearabouts-openai-source"}.${getExtension(format)}`,
    width: output.info.width,
    height: output.info.height,
  };
}

function encodeImage(pipeline: sharp.Sharp, format: NonNullable<OpenAIImageNormalizationOptions["format"]>, quality = 82) {
  if (format === "jpeg") {
    return pipeline.jpeg({ quality });
  }

  if (format === "webp") {
    return pipeline.webp({ quality });
  }

  return pipeline.png();
}

function getContentType(
  format: NonNullable<OpenAIImageNormalizationOptions["format"]>,
): NormalizedOpenAIImage["contentType"] {
  if (format === "jpeg") {
    return "image/jpeg";
  }

  if (format === "webp") {
    return "image/webp";
  }

  return "image/png";
}

function getExtension(format: NonNullable<OpenAIImageNormalizationOptions["format"]>) {
  return format === "jpeg" ? "jpg" : format;
}
