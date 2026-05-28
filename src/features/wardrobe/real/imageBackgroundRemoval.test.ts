import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { analyzeImageTransparency } from "./imageTransparencyValidation";
import { removeGeneratedAssetBackground } from "./imageBackgroundRemoval";

describe("removeGeneratedAssetBackground", () => {
  it("turns connected checkerboard-style background into alpha while preserving the garment", async () => {
    const source = await sharp({
      create: {
        width: 12,
        height: 12,
        channels: 4,
        background: { r: 246, g: 246, b: 246, alpha: 1 },
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="6" height="6" fill="#e0e0e0"/>
              <rect x="6" y="6" width="6" height="6" fill="#e0e0e0"/>
              <rect x="4" y="3" width="4" height="6" fill="#111111"/>
            </svg>`,
          ),
        },
      ])
      .png()
      .toBuffer();

    const result = await removeGeneratedAssetBackground(new Uint8Array(source));
    const transparency = await analyzeImageTransparency(result.bytes);
    const { data, info } = await sharp(Buffer.from(result.bytes)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const garmentCenterOffset = (6 * info.width + 6) * 4;

    expect(result.analysis.removedPixelRatio).toBeGreaterThan(0.5);
    expect(result.qualityNotes).toContain("Removed connected generated background so the garment can sit directly on the styling board.");
    expect(transparency.hasTransparentPixels).toBe(true);
    expect(data[garmentCenterOffset + 3]).toBe(255);
  });

  it("does not remove unconnected light garment details", async () => {
    const source = await sharp({
      create: {
        width: 12,
        height: 12,
        channels: 4,
        background: { r: 245, g: 245, b: 245, alpha: 1 },
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="6" height="6" fill="#111111"/>
              <rect x="5" y="5" width="2" height="2" fill="#f8f8f8"/>
            </svg>`,
          ),
        },
      ])
      .png()
      .toBuffer();

    const result = await removeGeneratedAssetBackground(new Uint8Array(source));
    const { data, info } = await sharp(Buffer.from(result.bytes)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const lightDetailOffset = (5 * info.width + 5) * 4;

    expect(data[lightDetailOffset + 3]).toBe(255);
  });
});
