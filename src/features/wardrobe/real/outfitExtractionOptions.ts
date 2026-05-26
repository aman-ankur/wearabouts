import type { OutfitExtractionMode } from "@/src/domain/wardrobe";

export interface OutfitExtractionOption {
  id: OutfitExtractionMode;
  title: string;
  shortLabel: string;
  description: string;
}

export const outfitExtractionOptions: OutfitExtractionOption[] = [
  {
    id: "pick_after_scan",
    title: "Pick after scan",
    shortLabel: "Scan first",
    description: "Wearabouts scans the photo first, then you choose the pieces worth preparing.",
  },
  {
    id: "new_tops",
    title: "Topwear",
    shortLabel: "Topwear",
    description: "Prepare shirts, tees, sweaters, jackets, and other upper-body layers.",
  },
  {
    id: "new_bottoms",
    title: "Bottomwear",
    shortLabel: "Bottomwear",
    description: "Prepare trousers, jeans, shorts, and other lower-body pieces.",
  },
  {
    id: "core_outfit",
    title: "Core outfit",
    shortLabel: "Core",
    description: "Prepare the clearest upper and lower pieces from this photo.",
  },
];

export function getOutfitExtractionOption(mode: OutfitExtractionMode): OutfitExtractionOption {
  return outfitExtractionOptions.find((option) => option.id === mode) ?? outfitExtractionOptions[0];
}
