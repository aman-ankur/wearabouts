import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { analyzeImageTransparency, getTransparencyQualityNotes } from "./imageTransparencyValidation";

describe("analyzeImageTransparency", () => {
  it("detects transparent PNG cutouts", async () => {
    const bytes = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 4,
              height: 4,
              channels: 4,
              background: { r: 20, g: 40, b: 80, alpha: 1 },
            },
          })
            .png()
            .toBuffer(),
          left: 3,
          top: 3,
        },
      ])
      .png()
      .toBuffer();

    const analysis = await analyzeImageTransparency(new Uint8Array(bytes));

    expect(analysis.hasAlphaChannel).toBe(true);
    expect(analysis.hasTransparentPixels).toBe(true);
    expect(analysis.transparentPixelRatio).toBeGreaterThan(0.5);
    expect(getTransparencyQualityNotes(analysis)).toContain("Generated transparent PNG cutout with alpha channel.");
  });

  it("keeps opaque PNGs as a non-blocking quality note", async () => {
    const bytes = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    const analysis = await analyzeImageTransparency(new Uint8Array(bytes));

    expect(analysis.hasAlphaChannel).toBe(false);
    expect(analysis.hasTransparentPixels).toBe(false);
    expect(getTransparencyQualityNotes(analysis)).toContain(
      "Generated PNG has no transparent alpha; keeping asset for review on the white outfit board.",
    );
  });
});
