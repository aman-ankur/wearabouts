import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { normalizeImageForOpenAI } from "./openaiImageNormalizer";

async function createWideImage() {
  return new Uint8Array(
    await sharp({
      create: {
        width: 2200,
        height: 1200,
        channels: 3,
        background: { r: 128, g: 96, b: 72 },
      },
    })
      .jpeg()
      .toBuffer(),
  );
}

describe("normalizeImageForOpenAI", () => {
  it("keeps the existing 1600px PNG profile by default", async () => {
    const normalized = await normalizeImageForOpenAI(await createWideImage());
    const metadata = await sharp(Buffer.from(normalized.bytes)).metadata();

    expect(normalized.contentType).toBe("image/png");
    expect(normalized.filename).toBe("wearabouts-openai-source.png");
    expect(normalized.width).toBe(1600);
    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBeLessThanOrEqual(1600);
  });

  it("can create a smaller JPEG detection profile", async () => {
    const normalized = await normalizeImageForOpenAI(await createWideImage(), {
      maxDimension: 1024,
      format: "jpeg",
      quality: 82,
      filenamePrefix: "wearabouts-openai-detection",
    });
    const metadata = await sharp(Buffer.from(normalized.bytes)).metadata();

    expect(normalized.contentType).toBe("image/jpeg");
    expect(normalized.filename).toBe("wearabouts-openai-detection.jpg");
    expect(normalized.width).toBe(1024);
    expect(metadata.width).toBe(1024);
    expect(metadata.height).toBeLessThanOrEqual(1024);
  });
});
