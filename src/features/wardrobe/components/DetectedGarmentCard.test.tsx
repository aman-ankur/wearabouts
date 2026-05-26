import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DetectedGarment } from "@/src/domain/wardrobe";
import { DetectedGarmentCard } from "./DetectedGarmentCard";

const garment: DetectedGarment = {
  id: "garment-real-1",
  uploadBatchId: "batch-real-1",
  proposedName: "Brown Collared Short Sleeve Shirt",
  brand: "New Balance",
  category: "tops",
  ownerProfileId: "profile-aankur",
  sourceType: "outfit_photo",
  confidence: "high",
  prettifyStatus: "ready",
  isLayered: false,
  readyForMixer: true,
  asset: {
    id: "asset-real-1",
    kind: "prettified",
    label: "Brown shirt studio asset",
    bucket: "closet-assets",
    storagePath: "demo-household/profile-aankur/asset-real-1.png",
    imageUrl: "https://signed.example/brown-shirt.png",
  },
};

describe("DetectedGarmentCard", () => {
  it("renders the prettified artwork as a large-preview button", () => {
    const html = renderToStaticMarkup(
      <DetectedGarmentCard garment={garment} onAdd={vi.fn()} onDelete={vi.fn()} onRetry={vi.fn()} />,
    );

    expect(html).toContain('aria-label="View Brown Collared Short Sleeve Shirt larger"');
    expect(html).toContain('src="https://signed.example/brown-shirt.png"');
  });
});
