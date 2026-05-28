"use client";

import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import type { StylistLook } from "@/src/features/wardrobe/stylist/stylistTypes";
import { MixerBodyStage } from "./MixerBodyStage";

interface StylistLookCardProps {
  look: StylistLook;
  closetItems: WardrobeItem[];
  onSave: (look: StylistLook) => void;
  onRefine: (look: StylistLook) => void;
  onReject?: (look: StylistLook) => void;
}

function selectedItemsForLook(look: StylistLook, closetItems: WardrobeItem[]): Partial<Record<OutfitSlot, WardrobeItem>> {
  return look.suggestion.selections.reduce<Partial<Record<OutfitSlot, WardrobeItem>>>((selected, selection) => {
    const item = closetItems.find((wardrobeItem) => wardrobeItem.id === selection.wardrobeItemId);
    if (item) {
      selected[selection.slot] = item;
    }

    return selected;
  }, {});
}

function selectedItemNames(look: StylistLook, closetItems: WardrobeItem[]): string[] {
  return look.suggestion.selections
    .map((selection) => closetItems.find((item) => item.id === selection.wardrobeItemId)?.name)
    .filter((name): name is string => Boolean(name));
}

export function StylistLookCard({ look, closetItems, onSave, onRefine, onReject }: StylistLookCardProps) {
  const selectedItems = selectedItemsForLook(look, closetItems);
  const itemNames = selectedItemNames(look, closetItems);
  const [dragX, setDragX] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  function finishDrag() {
    const threshold = 86;
    if (dragX >= threshold) {
      onSave(look);
    } else if (dragX <= -threshold && onReject) {
      onReject(look);
    }

    setDragX(0);
    setDragStartX(null);
  }

  return (
    <article
      className="card"
      onPointerDown={(event) => {
        setDragStartX(event.clientX);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (dragStartX === null) return;
        setDragX(Math.max(-120, Math.min(120, event.clientX - dragStartX)));
      }}
      onPointerCancel={finishDrag}
      onPointerUp={finishDrag}
      style={{
        display: "grid",
        gap: 12,
        background: "linear-gradient(180deg, #fffefa 0%, #f3eee6 100%)",
        touchAction: "pan-y",
        transform: `translateX(${dragX}px) rotate(${dragX / 26}deg)`,
        transition: dragStartX === null ? "transform 180ms ease" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <p className="subtle" style={{ margin: 0 }}>
            Closet-only look
          </p>
          <h2 style={{ fontSize: 22, lineHeight: 1.05, margin: "4px 0 0" }}>{look.title}</h2>
        </div>
        <span className="pill" style={{ flex: "0 0 auto" }}>
          {look.suggestion.confidenceLabel}
        </span>
      </div>

      <MixerBodyStage selectedItems={selectedItems} minHeight={304} background="#fffdf8" />

      <div style={{ display: "grid", gap: 8 }}>
        {look.caveats.length > 0 ? <span className="pill">{look.caveats[0]}</span> : null}
        <p className="subtle" style={{ margin: 0 }}>
          {look.weatherRationale}
        </p>
        <p className="subtle" style={{ margin: 0 }}>
          {look.styleRationale}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {itemNames.map((name) => (
            <span key={name} className="pill">
              {name}
            </span>
          ))}
        </div>
      </div>

      {look.missingPieceIdeas.length > 0 ? (
        <section
          aria-label="Not in your closet"
          style={{
            display: "grid",
            gap: 8,
            borderLeft: "3px solid #b28a42",
            background: "#fff8e8",
            borderRadius: "0 8px 8px 0",
            padding: "10px 10px 10px 12px",
          }}
        >
          <strong style={{ fontSize: 13 }}>Not in your closet</strong>
          {look.missingPieceIdeas.map((idea) => (
            <div key={idea.id} style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{idea.label}</span>
              <span className="subtle">Missing-piece idea · {idea.why}</span>
            </div>
          ))}
        </section>
      ) : null}

      {onReject ? (
        <div style={{ display: "grid", gridTemplateColumns: "52px minmax(0, 1fr) 52px", gap: 8, alignItems: "center" }}>
          <button type="button" className="button secondary" aria-label="Pass on this look" onClick={() => onReject(look)} style={{ padding: 0 }}>
            ×
          </button>
          <button type="button" className="button secondary" onClick={() => onRefine(look)}>
            <SlidersHorizontal size={16} aria-hidden="true" />
            Refine this look
          </button>
          <button type="button" className="button" aria-label="Save this look" onClick={() => onSave(look)} style={{ padding: 0 }}>
            ✓
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8 }}>
          <button type="button" className="button" onClick={() => onSave(look)}>
            Save
          </button>
          <button type="button" className="button secondary" onClick={() => onRefine(look)}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          Refine
          </button>
        </div>
      )}
    </article>
  );
}
