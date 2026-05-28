import React from "react";
import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { demoBodyPreview } from "@/src/features/wardrobe/fixtures/demoMixer";
import { ClosetAssetArtwork } from "./ClosetAssetArtwork";

interface MixerBodyStageProps {
  selectedItems: Partial<Record<OutfitSlot, WardrobeItem>>;
  minHeight?: number;
  background?: string;
}

const boardSlotOrder: OutfitSlot[] = ["layer", "top", "bottom", "shoes", "accessory"];

const boardSlotLabels: Record<OutfitSlot, string> = {
  layer: "Layer",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
};

function BoardItem({ item, slot }: { item?: WardrobeItem; slot: OutfitSlot }) {
  if (!item) {
    return null;
  }

  const isTallGarment = slot === "bottom" || slot === "layer";

  return (
    <div
      data-mixer-board-item-frame={slot}
      style={{
        minHeight: isTallGarment ? 190 : 154,
        display: "grid",
        gridTemplateRows: "minmax(0, 1fr) auto",
        gap: 8,
        padding: 10,
        border: "1px solid rgba(36,38,34,.12)",
        background: "linear-gradient(180deg, #f3eee6, #fffdf8)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.7)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          minHeight: 0,
          display: "grid",
          placeItems: "center",
          filter: "drop-shadow(0 10px 14px rgba(36,38,34,.12)) brightness(1.02) contrast(1.04)",
        }}
      >
        <ClosetAssetArtwork asset={item.asset} />
      </div>
      <div
        style={{
          minWidth: 0,
          display: "flex",
          justifyContent: "space-between",
          gap: 6,
          color: "var(--muted)",
          fontSize: 11,
          fontWeight: 820,
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
        <span>{boardSlotLabels[slot]}</span>
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "right",
            textTransform: "none",
            letterSpacing: 0,
          }}
        >
          {item.name}
        </span>
      </div>
    </div>
  );
}

export function MixerBodyStage({ selectedItems, minHeight = 390, background = "#fff" }: MixerBodyStageProps) {
  const visibleSlots = boardSlotOrder.filter((slot) => selectedItems[slot]);

  return (
    <section
      aria-label={demoBodyPreview.label}
      data-mixer-board-canvas="clean"
      style={{
        minHeight,
        borderRadius: 0,
        background,
        display: "grid",
        gridTemplateColumns: visibleSlots.length === 1 ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
        gap: 10,
        alignContent: "center",
        padding: 14,
        overflow: "hidden",
      }}
    >
      {visibleSlots.map((slot) => (
        <BoardItem key={slot} item={selectedItems[slot]} slot={slot} />
      ))}
    </section>
  );
}
