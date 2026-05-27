import React from "react";
import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { demoBodyPreview } from "@/src/features/wardrobe/fixtures/demoMixer";
import { ClosetAssetArtwork } from "./ClosetAssetArtwork";

interface MixerBodyStageProps {
  selectedItems: Partial<Record<OutfitSlot, WardrobeItem>>;
}

interface BoardItemPlacement {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  width: string;
  height: number;
  scale: number;
  opacity?: number;
  zIndex: number;
}

const boardItemPlacement: Record<OutfitSlot, BoardItemPlacement> = {
  layer: { left: "2%", top: "40px", width: "38%", height: 160, scale: 1.2, opacity: 0.15, zIndex: 1 },
  top: { left: "4%", top: "38px", width: "50%", height: 176, scale: 1.24, zIndex: 3 },
  bottom: { right: "3%", top: "44px", width: "42%", height: 284, scale: 0.98, zIndex: 2 },
  shoes: { left: "19%", bottom: "36px", width: "62%", height: 124, scale: 1.04, zIndex: 4 },
  accessory: { right: "6%", bottom: "124px", width: "26%", height: 78, scale: 1.35, zIndex: 5 },
};

function BoardItem({ item, slot }: { item?: WardrobeItem; slot: OutfitSlot }) {
  if (!item) {
    return null;
  }

  const placement = boardItemPlacement[slot];
  const shouldSoftenEdges = slot === "top" || slot === "layer" || slot === "accessory";

  return (
    <div
      data-mixer-board-item-frame={slot}
      style={{
        position: "absolute",
        left: placement.left,
        right: placement.right,
        top: placement.top,
        bottom: placement.bottom,
        width: placement.width,
        height: placement.height,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        opacity: placement.opacity ?? 1,
        zIndex: placement.zIndex,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${placement.scale})`,
          filter: "brightness(1.055) contrast(1.07) saturate(0.98)",
          WebkitMaskImage: shouldSoftenEdges
            ? "radial-gradient(ellipse 72% 76% at 50% 50%, #000 56%, rgba(0,0,0,.82) 70%, transparent 88%)"
            : undefined,
          maskImage: shouldSoftenEdges
            ? "radial-gradient(ellipse 72% 76% at 50% 50%, #000 56%, rgba(0,0,0,.82) 70%, transparent 88%)"
            : undefined,
        }}
      >
        <ClosetAssetArtwork asset={item.asset} />
      </div>
    </div>
  );
}

export function MixerBodyStage({ selectedItems }: MixerBodyStageProps) {
  return (
    <section
      aria-label={demoBodyPreview.label}
      data-mixer-board-canvas="clean"
      style={{
        minHeight: 390,
        borderRadius: 0,
        background: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BoardItem item={selectedItems.layer} slot="layer" />
      <BoardItem item={selectedItems.top} slot="top" />
      <BoardItem item={selectedItems.bottom} slot="bottom" />
      <BoardItem item={selectedItems.shoes} slot="shoes" />
      <BoardItem item={selectedItems.accessory} slot="accessory" />
    </section>
  );
}
