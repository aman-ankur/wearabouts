import React from "react";
import type { ClosetAsset } from "@/src/domain/wardrobe";
import { GarmentArtwork } from "./GarmentArtwork";

interface ClosetAssetArtworkProps {
  asset: ClosetAsset;
}

export function ClosetAssetArtwork({ asset }: ClosetAssetArtworkProps) {
  if ("imageUrl" in asset) {
    return (
      <img
        src={asset.imageUrl}
        alt={asset.label}
        style={{ width: "100%", height: "100%", maxHeight: 132, objectFit: "contain" }}
      />
    );
  }

  return <GarmentArtwork token={asset.visualToken} />;
}
