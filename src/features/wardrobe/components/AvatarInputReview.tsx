import React from "react";
import type { AvatarInputKind, AvatarInputQualityCheck } from "@/src/features/wardrobe/avatar/avatarTypes";

interface AvatarInputReviewProps {
  kind: AvatarInputKind;
  previewUrl?: string;
  quality?: AvatarInputQualityCheck | null;
  onSwap: () => void;
}

const labels: Record<AvatarInputKind, string> = {
  face: "Face Pic",
  body: "Body Pic",
};

function qualityLabel(quality?: AvatarInputQualityCheck | null): string {
  if (!quality) return "Pending";
  if (quality.status === "passed") return "Looks good";
  if (quality.status === "warning") return "Usable with warning";
  if (quality.status === "failed") return "Needs a better photo";
  return "Pending";
}

export function AvatarInputReview({ kind, previewUrl, quality, onSwap }: AvatarInputReviewProps) {
  return (
    <article className="card" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <strong>{labels[kind]}</strong>
        <button type="button" className="button secondary" onClick={onSwap} style={{ width: "auto", minHeight: 34, padding: "7px 11px" }}>
          Swap
        </button>
      </div>
      <div
        style={{
          minHeight: 148,
          display: "grid",
          placeItems: "center",
          background: "#f7f4ef",
          border: "1px solid var(--line)",
          overflow: "hidden",
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={`${labels[kind]} preview`} style={{ width: "100%", height: 180, objectFit: "cover" }} />
        ) : (
          <span className="subtle">No photo selected</span>
        )}
      </div>
      <span className={quality?.status === "failed" ? "pill" : quality?.status === "passed" ? "pill dark" : "pill"}>
        {qualityLabel(quality)}
      </span>
      {quality?.reasons.length ? (
        <p className="subtle" style={{ margin: 0 }}>
          {quality.reasons.join(" ")}
        </p>
      ) : null}
    </article>
  );
}
