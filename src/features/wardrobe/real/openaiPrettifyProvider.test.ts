import { describe, expect, it } from "vitest";
import { buildOpenAIPrettifyPrompt } from "./openaiPrettifyProvider";

describe("buildOpenAIPrettifyPrompt", () => {
  it("requires a faithful transparent PNG garment cutout", () => {
    const prompt = buildOpenAIPrettifyPrompt({
      accepted: true,
      proposedName: "Red graphic t-shirt",
      category: "tops",
      confidence: "high",
      readyForMixer: true,
      cropPrompt: "front of the red shirt with chest logo",
    });

    expect(prompt).toContain("transparent-background PNG cutout");
    expect(prompt).toContain("transparent alpha channel");
    expect(prompt).toContain("do not draw a checkerboard transparency grid");
    expect(prompt).toContain("isolated garment only");
    expect(prompt).toContain("No floor, hanger, mannequin, hands, person");
    expect(prompt).toContain("Preserve the original color, pattern, silhouette, logos");
    expect(prompt).toContain("Do not over-brighten white, cream, beige, or reflective garments");
    expect(prompt).toContain("include the whole item");
    expect(prompt).toContain("Do not invent a different garment");
    expect(prompt).toContain("front of the red shirt with chest logo");
  });
});
