import { Check, RotateCcw, Trash2 } from "lucide-react";
import type { DetectedGarment } from "@/src/domain/wardrobe";
import { ClosetAssetArtwork } from "./ClosetAssetArtwork";

interface DetectedGarmentCardProps {
  garment: DetectedGarment;
  onAdd: (garmentId: string) => void;
  onDelete: (garmentId: string) => void;
  onRetry: (garmentId: string) => void;
}

export function DetectedGarmentCard({ garment, onAdd, onDelete, onRetry }: DetectedGarmentCardProps) {
  return (
    <article
      className="card"
      style={{
        display: "grid",
        gap: 12,
        background: "#444341",
        color: "white",
        padding: 14,
      }}
    >
      <div
        style={{
          aspectRatio: "1 / 1",
          width: "100%",
          maxHeight: 360,
          borderRadius: 8,
          background: "#5a5956",
          display: "grid",
          placeItems: "center",
          padding: 10,
          overflow: "hidden",
        }}
      >
        <ClosetAssetArtwork asset={garment.asset} />
      </div>
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
              color: "white",
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
            color: "#f2eee7",
            borderBottom: "1px solid rgba(255,255,255,.18)",
            fontSize: 13,
          }}
        >
          {garment.brand || "Add brand"}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className="pill">{garment.category}</span>
          <span className="pill">{garment.confidence} confidence</span>
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
  );
}
