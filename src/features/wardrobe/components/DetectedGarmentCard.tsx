"use client";

import React, { useState } from "react";
import { Check, RotateCcw, Trash2, X } from "lucide-react";
import type { DetectedGarment } from "@/src/domain/wardrobe";
import { ClosetAssetArtwork } from "./ClosetAssetArtwork";

interface DetectedGarmentCardProps {
  garment: DetectedGarment;
  onAdd: (garmentId: string) => void;
  onDelete: (garmentId: string) => void;
  onRetry: (garmentId: string) => void;
}

export function DetectedGarmentCard({ garment, onAdd, onDelete, onRetry }: DetectedGarmentCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <article
        className="card"
        style={{
          display: "grid",
          gap: 12,
          background: "var(--white)",
          color: "var(--ink)",
          padding: 14,
        }}
      >
        <button
          type="button"
          aria-label={`View ${garment.proposedName} larger`}
          onClick={() => setIsPreviewOpen(true)}
          style={{
            aspectRatio: "1 / 1",
            width: "100%",
            maxHeight: 360,
            borderRadius: 8,
            border: 0,
            background: "radial-gradient(circle at 50% 48%, rgba(239,233,223,.72), rgba(255,255,255,0) 68%), var(--white)",
            display: "grid",
            placeItems: "center",
            padding: 10,
            overflow: "hidden",
            cursor: "zoom-in",
          }}
        >
          <ClosetAssetArtwork asset={garment.asset} />
        </button>
        <div style={{ minWidth: 0, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <strong style={{ lineHeight: 1.25, fontSize: 17 }}>{garment.proposedName}</strong>
            <button
              type="button"
              onClick={() => onDelete(garment.id)}
              aria-label={`Delete ${garment.proposedName}`}
              style={{
                border: 0,
                background: "transparent",
                color: "var(--ink)",
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              <Trash2 size={17} />
            </button>
          </div>
          <div
            style={{
              minHeight: 34,
              display: "flex",
              alignItems: "center",
              color: "var(--muted)",
              borderBottom: "1px solid var(--line)",
              fontSize: 13,
            }}
          >
            {garment.brand || "Add brand"}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="pill">{garment.sourceType === "outfit_photo" ? "outfit photo" : "item photo"}</span>
            <span className="pill">{garment.category}</span>
            <span className="pill">{garment.confidence} confidence</span>
            {garment.visibilityState ? <span className="pill">{garment.visibilityState.replace("_", " ")}</span> : null}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <button type="button" className="button ghost" onClick={() => onRetry(garment.id)} style={{ minHeight: 42 }}>
              <RotateCcw size={15} /> Retry
            </button>
            <button type="button" className="button secondary" onClick={() => onAdd(garment.id)} style={{ minHeight: 42 }}>
              <Check size={15} /> Add
            </button>
          </div>
        </div>
      </article>

      {isPreviewOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${garment.proposedName} large preview`}
          onClick={() => setIsPreviewOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(0,0,0,0.82)",
            display: "grid",
            alignItems: "end",
          }}
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setIsPreviewOpen(false)}
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.12)",
              color: "var(--white)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={22} />
          </button>
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxHeight: "82vh",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              background: "#050505",
              padding: "18px 18px 28px",
              display: "grid",
              gap: 12,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 42,
                height: 5,
                borderRadius: 999,
                background: "rgba(255,255,255,0.55)",
                justifySelf: "center",
              }}
            />
            <div
              style={{
                width: "100%",
                height: "min(70vh, 680px)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <ClosetAssetArtwork asset={garment.asset} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
