import { describe, expect, it } from "vitest";
import { estimateImageOutputCostUsd, summarizeTelemetryCost } from "./prettifyTelemetry";

describe("prettifyTelemetry", () => {
  it("estimates high-quality 1024 square GPT Image 1.5 output cost", () => {
    expect(
      estimateImageOutputCostUsd({
        model: "gpt-image-1.5",
        quality: "high",
        size: "1024x1024",
      }),
    ).toBe(0.133);
  });

  it("sums only known image output estimates", () => {
    expect(
      summarizeTelemetryCost([
        { imageOutputCostUsd: 0.133 },
        { imageOutputCostUsd: 0.133 },
        { imageOutputCostUsd: null },
      ]),
    ).toEqual({ knownImageOutputCostUsd: 0.266, unknownCostEvents: 1 });
  });
});
