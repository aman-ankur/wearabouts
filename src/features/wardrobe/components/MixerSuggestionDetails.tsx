import React from "react";
import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import type { OutfitSuggestion } from "@/src/features/wardrobe/outfits/outfitTypes";

interface MixerSuggestionDetailsProps {
  suggestion: OutfitSuggestion;
  closetItems: WardrobeItem[];
}

const pieceOrder: OutfitSlot[] = ["layer", "onePiece", "top", "bottom", "shoes", "accessory"];

const pieceLabels: Record<OutfitSlot, string> = {
  onePiece: "One-piece",
  layer: "Layer",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
};

function selectedPieces(suggestion: OutfitSuggestion, closetItems: WardrobeItem[]) {
  return pieceOrder
    .map((slot) => {
      const itemId = suggestion.selections.find((selection) => selection.slot === slot)?.wardrobeItemId;
      const item = itemId ? closetItems.find((closetItem) => closetItem.id === itemId) : null;
      return item ? { slot, item } : null;
    })
    .filter((entry): entry is { slot: OutfitSlot; item: WardrobeItem } => Boolean(entry));
}

export function MixerSuggestionDetails({ suggestion, closetItems }: MixerSuggestionDetailsProps) {
  const pieces = selectedPieces(suggestion, closetItems);

  return (
    <section style={{ display: "grid", gap: 10 }}>
      {suggestion.warnings.length > 0 ? <span className="pill">{suggestion.warnings[0]}</span> : null}
      <p className="subtle" style={{ margin: 0 }}>
        {suggestion.rationale}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 13 }}>Pieces</strong>
        <div style={{ display: "grid", gap: 6 }}>
          {pieces.map(({ slot, item }) => (
            <div
              key={slot}
              style={{
                display: "grid",
                gridTemplateColumns: "76px minmax(0, 1fr)",
                gap: 8,
                alignItems: "baseline",
              }}
            >
              <span
                className="subtle"
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                {pieceLabels[slot]}
              </span>
              <span style={{ color: "var(--muted)", lineHeight: 1.35 }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
