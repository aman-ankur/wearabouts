import { Check, RotateCcw, Trash2 } from "lucide-react";
import type { DetectedGarment } from "@/src/domain/wardrobe";
import { GarmentArtwork } from "./GarmentArtwork";

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
        gridTemplateColumns: "96px minmax(0,1fr)",
        gap: 12,
        background: "#4a4a4a",
        color: "white",
      }}
    >
      <div style={{ minHeight: 112, borderRadius: 8, background: "#626262", display: "grid", placeItems: "center" }}>
        <GarmentArtwork token={garment.asset.visualToken} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {garment.proposedName}
          </strong>
          <button
            type="button"
            onClick={() => onDelete(garment.id)}
            aria-label={`Delete ${garment.proposedName}`}
            style={{ border: 0, background: "transparent", color: "white" }}
          >
            <Trash2 size={17} />
          </button>
        </div>
        <div
          style={{
            height: 34,
            display: "flex",
            alignItems: "center",
            color: "#cfcfcf",
            borderBottom: "1px solid rgba(255,255,255,.18)",
            fontSize: 13,
          }}
        >
          {garment.brand || "Add brand"}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
          <span className="pill">{garment.category}</span>
          <span className="pill">{garment.confidence} confidence</span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="button ghost" onClick={() => onRetry(garment.id)} style={{ minHeight: 36 }}>
            <RotateCcw size={15} /> Retry
          </button>
          <button type="button" className="button secondary" onClick={() => onAdd(garment.id)} style={{ minHeight: 36 }}>
            <Check size={15} /> Add
          </button>
        </div>
      </div>
    </article>
  );
}
