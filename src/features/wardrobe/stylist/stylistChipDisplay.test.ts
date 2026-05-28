import { describe, expect, it } from "vitest";
import type { StylistChip } from "./stylistTypes";
import { getVisibleStylistChips } from "./stylistChipDisplay";

function chip(id: string): StylistChip {
  return { id, label: id, kind: "occasion", reason: id };
}

describe("getVisibleStylistChips", () => {
  it("keeps the collapsed chip grid within three rows including the more control", () => {
    const result = getVisibleStylistChips(Array.from({ length: 12 }, (_, index) => chip(`chip-${index + 1}`)), false);

    expect(result.chips).toHaveLength(8);
    expect(result.hiddenChipCount).toBe(4);
    expect(result.totalVisibleControls).toBe(9);
  });

  it("shows every chip when expanded and reserves room for the less control", () => {
    const result = getVisibleStylistChips(Array.from({ length: 12 }, (_, index) => chip(`chip-${index + 1}`)), true);

    expect(result.chips).toHaveLength(12);
    expect(result.hiddenChipCount).toBe(0);
    expect(result.totalVisibleControls).toBe(13);
  });
});
