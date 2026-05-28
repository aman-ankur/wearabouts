import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ClosetAsset } from "@/src/domain/wardrobe";
import { ClosetAssetArtwork } from "./ClosetAssetArtwork";

describe("ClosetAssetArtwork", () => {
  it("renders demo garment artwork for visual-token assets", () => {
    const asset: ClosetAsset = {
      id: "asset-demo",
      kind: "prettified",
      label: "Demo sweater",
      visualToken: "sweater-cream",
    };

    expect(renderToStaticMarkup(<ClosetAssetArtwork asset={asset} />)).toContain("Garment artwork");
  });

  it("renders a signed image for real assets", () => {
    const asset: ClosetAsset = {
      id: "asset-real",
      kind: "prettified",
      label: "Generated studio asset",
      bucket: "closet-assets",
      storagePath: "demo-household/profile-aankur/asset-real.png",
      imageUrl: "https://signed.example/asset.png",
    };

    const html = renderToStaticMarkup(<ClosetAssetArtwork asset={asset} />);

    expect(html).toContain('src="https://signed.example/asset.png"');
    expect(html).toContain('alt="Generated studio asset"');
    expect(html).toContain('data-closet-asset-artwork="real"');
    expect(html).toContain("position:relative");
  });
});
