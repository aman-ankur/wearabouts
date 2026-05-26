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
      <Image
        src={asset.imageUrl}
        alt={asset.label}
        width={132}
        height={132}
        unoptimized
        style={{ width: "100%", height: "100%", maxHeight: "100%", objectFit: "contain" }}
      />
    );
  }

  return <GarmentArtwork token={asset.visualToken} />;
}
