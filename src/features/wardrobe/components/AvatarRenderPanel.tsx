"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ImageOff, RefreshCw, Sparkles, Trash2, UserRound } from "lucide-react";
import type { OutfitSlot, SavedOutfit, WardrobeItem } from "@/src/domain/wardrobe";
import type { AvatarProfile, AvatarRender } from "@/src/features/wardrobe/avatar/avatarTypes";
import { MixerBodyStage } from "./MixerBodyStage";

interface AvatarRenderPanelProps {
  savedOutfit: SavedOutfit;
  closetItems: WardrobeItem[];
  avatarProfile: AvatarProfile | null;
  render: AvatarRender | null;
  canRegenerate: boolean;
  isBusy?: boolean;
  onUpdateAvatar?: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onDelete: (renderId: string) => void;
}

function selectedItemsForOutfit(outfit: SavedOutfit, closetItems: WardrobeItem[]): Partial<Record<OutfitSlot, WardrobeItem>> {
  return outfit.selections.reduce<Partial<Record<OutfitSlot, WardrobeItem>>>((selected, selection) => {
    const item = closetItems.find((wardrobeItem) => wardrobeItem.id === selection.wardrobeItemId);
    if (item) selected[selection.slot] = item;
    return selected;
  }, {});
}

function selectedItemNames(outfit: SavedOutfit, closetItems: WardrobeItem[]): string[] {
  return outfit.selections
    .map((selection) => closetItems.find((item) => item.id === selection.wardrobeItemId)?.name)
    .filter((name): name is string => Boolean(name));
}

function stateLabel(render: AvatarRender | null, isBusy?: boolean): string {
  if (isBusy || render?.status === "rendering" || render?.status === "queued") return "Rendering";
  if (render?.status === "ready") return "Preview ready";
  if (render?.status === "failed") return "Render failed";
  return "Ready to render";
}

export function AvatarMagicProcessingStage() {
  return (
    <section className="avatar-magic-stage" aria-live="polite" aria-label="Avatar render progress">
      <span className="avatar-magic-wand" aria-hidden="true" />
      <div className="avatar-magic-copy">
        <span>Working</span>
        <strong>Composing your avatar</strong>
        <p>Confident posture, natural casual pose, and the exact saved outfit.</p>
      </div>
      <div className="avatar-processing-stream">
        <span>balancing the pose</span>
        <span>keeping garment colors and shapes faithful</span>
        <span>checking head-to-toe framing</span>
        <span>relaxing shoulders, avoiding hunches</span>
        <span>polishing studio light</span>
      </div>
    </section>
  );
}

export function AvatarRenderPanel({
  savedOutfit,
  closetItems,
  avatarProfile,
  render,
  canRegenerate,
  isBusy,
  onUpdateAvatar,
  onGenerate,
  onRegenerate,
  onDelete,
}: AvatarRenderPanelProps) {
  const [showOutfitBoard, setShowOutfitBoard] = useState(false);
  const selectedItems = selectedItemsForOutfit(savedOutfit, closetItems);
  const itemNames = selectedItemNames(savedOutfit, closetItems);
  const showAvatarImage = render?.status === "ready" && render.imageUrl && !showOutfitBoard;

  if (!avatarProfile) {
    return (
      <section className="card" style={{ display: "grid", gap: 10 }}>
        <strong>Set up avatar photos</strong>
        <p className="subtle" style={{ margin: 0 }}>
          Add one face pic and one body pic before generating a saved-look avatar preview.
        </p>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="card" style={{ display: "grid", gap: 8, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <strong>{stateLabel(render, isBusy)}</strong>
            <p className="subtle" style={{ margin: "2px 0 0", fontSize: 12 }}>
              {itemNames.length} wardrobe {itemNames.length === 1 ? "item" : "items"} · {savedOutfit.name}
            </p>
          </div>
          {render?.status === "ready" ? (
            <span className="pill" style={{ flex: "0 0 auto", minHeight: 26, padding: "5px 9px", fontSize: 12 }}>
              Saved
            </span>
          ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {render?.status === "ready" ? (
            <Link className="button secondary" href="/stylist" style={{ minHeight: 32, padding: "6px 10px", width: "auto", fontSize: 13 }}>
              Saved renders
            </Link>
          ) : null}
          {onUpdateAvatar ? (
            <button
              type="button"
              className="button secondary"
              onClick={onUpdateAvatar}
              style={{ minHeight: 32, padding: "6px 10px", width: "auto", fontSize: 13 }}
            >
              <UserRound size={16} aria-hidden="true" />
              Update photos
            </button>
          ) : null}
        </div>
      </div>

      {isBusy || render?.status === "rendering" || render?.status === "queued" ? (
        <AvatarMagicProcessingStage />
      ) : showAvatarImage ? (
        <div className="card" style={{ display: "grid", gap: 10, background: "#eeeeec" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={render.imageUrl} alt={`${savedOutfit.name} avatar preview`} style={{ width: "100%", maxHeight: 560, objectFit: "contain" }} />
          <p className="subtle" style={{ margin: 0 }}>
            {render.qualityNotes.join(" ")}
          </p>
        </div>
      ) : (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <MixerBodyStage selectedItems={selectedItems} minHeight={320} background="#fffdf8" />
          <span className="pill" style={{ justifySelf: "start" }}>
            <ImageOff size={14} aria-hidden="true" />
            Outfit board fallback
          </span>
          {render?.qualityNotes.length ? (
            <p className="subtle" style={{ margin: 0 }}>
              {render.qualityNotes.join(" ")}
            </p>
          ) : null}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        {!render || render.status === "failed" ? (
          <button type="button" className="button" disabled={isBusy || !canRegenerate} onClick={onGenerate}>
            <Sparkles size={16} aria-hidden="true" />
            Generate preview
          </button>
        ) : (
          <button type="button" className="button" disabled={isBusy || !canRegenerate} onClick={onRegenerate}>
            <RefreshCw size={16} aria-hidden="true" />
            Regenerate
          </button>
        )}
        {render ? (
          <button type="button" className="button secondary" onClick={() => onDelete(render.id)}>
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </button>
        ) : (
          <button type="button" className="button secondary" disabled>
            Outfit board
          </button>
        )}
      </div>
      {render?.status === "ready" ? (
        <button type="button" className="button secondary" onClick={() => setShowOutfitBoard((current) => !current)}>
          <ImageOff size={16} aria-hidden="true" />
          {showOutfitBoard ? "View avatar render" : "View outfit board"}
        </button>
      ) : null}
      {!canRegenerate ? (
        <p className="subtle" style={{ margin: 0 }}>
          Regenerate limit reached for this saved look. The outfit board remains available.
        </p>
      ) : null}
    </section>
  );
}
