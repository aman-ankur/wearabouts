import { describe, expect, it } from "vitest";
import { getOutfitExtractionOption, outfitExtractionOptions } from "./outfitExtractionOptions";

describe("outfitExtractionOptions", () => {
  it("uses neutral compact labels for upload mode selection", () => {
    expect(outfitExtractionOptions.map((option) => option.title)).toEqual([
      "Choose pieces",
      "Topwear",
      "Bottomwear",
      "Core outfit",
    ]);
    expect(outfitExtractionOptions.map((option) => option.shortLabel)).toEqual([
      "Choose pieces",
      "Topwear",
      "Bottomwear",
      "Core",
    ]);
  });

  it("returns the selected option summary for contextual help", () => {
    expect(getOutfitExtractionOption("new_tops").description).toBe(
      "Prepare shirts, tees, sweaters, jackets, and other upper-body layers.",
    );
  });
});
