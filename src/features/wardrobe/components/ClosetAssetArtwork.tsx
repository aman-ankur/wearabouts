import React from "react";
import Image from "next/image";
import type { ClosetAsset } from "@/src/domain/wardrobe";
import { GarmentArtwork } from "./GarmentArtwork";

interface ClosetAssetArtworkProps {
  asset: ClosetAsset;
}

export function ClosetAssetArtwork({ asset }: ClosetAssetArtworkProps) {
  if ("imageUrl" in asset) {
    return (
      <span
        data-closet-asset-frame="real"
        style={{ position: "relative", display: "block", width: "100%", height: "100%", minHeight: 0 }}
      >
        <Image src={asset.imageUrl} alt={asset.label} fill sizes="360px" unoptimized style={{ objectFit: "contain" }} />
      </span>
    );
  }

  return <GarmentArtwork token={asset.visualToken} />;
}
