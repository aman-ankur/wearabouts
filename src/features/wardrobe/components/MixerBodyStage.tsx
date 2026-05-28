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

const slotOrderForLabels: OutfitSlot[] = ["layer", "top", "bottom", "shoes", "accessory"];

function getSlotStyle(slot: OutfitSlot, selectedItems: Partial<Record<OutfitSlot, WardrobeItem>>): React.CSSProperties {
  const hasLayer = Boolean(selectedItems.layer);
  const hasTop = Boolean(selectedItems.top);
  const base: React.CSSProperties = { position: "absolute" };

  if (slot === "layer") {
    return hasTop
      ? { ...base, left: "0%", top: "1%", width: "48%", height: "33%" }
      : { ...base, left: "22%", top: "1%", width: "56%", height: "33%" };
  }

  if (slot === "top") {
    return hasLayer
      ? { ...base, left: "52%", top: "1%", width: "48%", height: "33%" }
      : { ...base, left: "22%", top: "1%", width: "56%", height: "33%" };
  }

  if (slot === "bottom") {
    return { ...base, left: "23%", top: "42%", width: "54%", height: "34%" };
  }

  if (slot === "shoes") {
    return { ...base, left: "30%", top: "84%", width: "40%", height: "12%" };
  }

  return { ...base, right: "6%", top: "36%", width: "22%", height: "18%" };
}

function BoardItem({ item, slot }: { item?: WardrobeItem; slot: OutfitSlot }) {
  if (!item) {
    return null;
  }

  return (
    <div
      data-mixer-board-item={slot}
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        filter: "drop-shadow(0 16px 18px rgba(36,38,34,.10))",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "center",
        }}
      >
        <ClosetAssetArtwork asset={item.asset} />
      </div>
    </div>
  );
}

export function MixerBodyStage({ selectedItems, minHeight = 390, background = "#fff" }: MixerBodyStageProps) {
  const visibleSlots = boardSlotOrder.filter((slot) => selectedItems[slot]);
  const labels = slotOrderForLabels
    .map((slot) => ({ slot, item: selectedItems[slot] }))
    .filter((entry): entry is { slot: OutfitSlot; item: WardrobeItem } => Boolean(entry.item));

  return (
    <section
      aria-label={demoBodyPreview.label}
      data-mixer-board-canvas="clean"
      style={{
        minHeight,
        borderRadius: 0,
        background,
        display: "grid",
        gridTemplateRows: "minmax(0, 1fr) auto",
        gap: 8,
        padding: 10,
        overflow: "hidden",
      }}
    >
      <div
        data-mixer-board-surface="white"
        style={{
          position: "relative",
          minHeight: Math.max(minHeight - 58, 270),
          background,
          overflow: "hidden",
        }}
      >
        {visibleSlots.map((slot) => (
          <div key={slot} style={getSlotStyle(slot, selectedItems)}>
            <BoardItem item={selectedItems[slot]} slot={slot} />
          </div>
        ))}
      </div>
      {labels.length > 0 ? (
        <div
          data-mixer-board-labels="subtle"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            paddingTop: 2,
          }}
        >
          {labels.map(({ slot, item }) => (
            <span
              key={slot}
              className="subtle"
              style={{
                flex: "0 0 auto",
                maxWidth: 150,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 11,
              }}
            >
              {boardSlotLabels[slot]}: {item.name}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
