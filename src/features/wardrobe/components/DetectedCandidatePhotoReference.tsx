import React from "react";
import Image from "next/image";
import type { GarmentCandidateChoice, UploadSourceImageReference } from "@/src/domain/wardrobe";

interface DetectedCandidatePhotoReferenceProps {
  sourceImage: UploadSourceImageReference;
  candidates: GarmentCandidateChoice[];
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const candidateColors = ["#48614c", "#245c91", "#9a7236", "#9d3146", "#5f5597", "#62605b"];

export function DetectedCandidatePhotoReference({
  sourceImage,
  candidates,
  expanded = false,
  onToggleExpanded,
}: DetectedCandidatePhotoReferenceProps) {
  const visibleCandidates = candidates.filter((candidate) => candidate.boundingBox);
  const photoFocus = getPhotoPreviewFocus(visibleCandidates);

  if (visibleCandidates.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        display: "grid",
        gap: 10,
        padding: 12,
        border: "1px solid var(--line)",
        borderRadius: 8,
        background: "var(--white)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <span
          style={{
            color: "var(--muted)",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Uploaded photo
        </span>
        {onToggleExpanded ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 999,
              background: "var(--white)",
              padding: "7px 11px",
              color: "var(--ink)",
              fontSize: 13,
              fontWeight: 820,
              whiteSpace: "nowrap",
            }}
          >
            {expanded ? "Shown large" : "View large"}
          </button>
        ) : null}
      </div>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 8,
          border: "1px solid var(--line)",
          background: "var(--wash)",
          height: expanded ? 520 : 270,
        }}
      >
        <Image
          src={sourceImage.imageUrl}
          alt={`Uploaded photo ${sourceImage.originalFilename}`}
          fill
          sizes="(max-width: 430px) 100vw, 390px"
          unoptimized
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: expanded ? "50% 50%" : `${asPercent(photoFocus.x)} ${asPercent(photoFocus.y)}`,
          }}
        />
      </div>

      <p className="subtle" style={{ margin: 0, fontSize: 12 }}>
        {visibleCandidates.length} {visibleCandidates.length === 1 ? "piece" : "pieces"} found. Review selections below.
      </p>
    </section>
  );
}

export function CandidateCropThumbnail({
  sourceImage,
  candidate,
  size = 52,
}: {
  sourceImage?: UploadSourceImageReference;
  candidate: GarmentCandidateChoice;
  size?: number;
}) {
  if (!sourceImage) {
    return null;
  }

  const centerX = candidate.boundingBox.x + candidate.boundingBox.width / 2;
  const centerY = candidate.boundingBox.y + candidate.boundingBox.height / 2;
  const zoom = getThumbnailZoom(candidate);

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        border: "1px solid var(--line)",
        background: "var(--wash)",
        overflow: "hidden",
        flex: "0 0 auto",
        position: "relative",
      }}
    >
      <Image
        src={sourceImage.imageUrl}
        alt=""
        fill
        sizes={`${size}px`}
        unoptimized
        style={{
          objectFit: "cover",
          objectPosition: `${asPercent(centerX)} ${asPercent(centerY)}`,
          transform: `scale(${zoom})`,
          transformOrigin: `${asPercent(centerX)} ${asPercent(centerY)}`,
        }}
      />
    </span>
  );
}

export function CandidateNumber({
  index,
  variant = "soft",
}: {
  index: number;
  variant?: "soft" | "solid" | "neutral";
}) {
  const color = getCandidateColor(index);
  const isSolid = variant === "solid";
  const isNeutral = variant === "neutral";

  return (
    <span
      aria-hidden="true"
      style={{
        width: 19,
        height: 19,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: isNeutral ? "var(--wash)" : isSolid ? color : hexToRgba(color, 0.12),
        color: isNeutral ? "var(--ink)" : isSolid ? "var(--white)" : color,
        border: isNeutral
          ? "1px solid rgba(17,17,17,0.12)"
          : isSolid
            ? "1px solid transparent"
            : `1px solid ${hexToRgba(color, 0.2)}`,
        fontSize: 10,
        fontWeight: 900,
        flex: "0 0 auto",
      }}
    >
      {index + 1}
    </span>
  );
}

export function getCandidateColor(index: number) {
  return candidateColors[index % candidateColors.length];
}

export function getPhotoPreviewFocus(candidates: GarmentCandidateChoice[]) {
  if (candidates.length === 0) {
    return { x: 0.5, y: 0.46 };
  }

  const upperBodyCandidates = candidates.filter(
    (candidate) => candidate.category === "tops" || candidate.category === "outerwear" || candidate.category === "accessories",
  );
  const focusCandidates = upperBodyCandidates.length > 0 ? upperBodyCandidates : candidates;
  const averageX =
    focusCandidates.reduce((total, candidate) => total + candidate.boundingBox.x + candidate.boundingBox.width / 2, 0) /
    focusCandidates.length;
  const averageY =
    focusCandidates.reduce((total, candidate) => total + candidate.boundingBox.y + candidate.boundingBox.height / 2, 0) /
    focusCandidates.length;

  return {
    x: Math.max(0.32, Math.min(0.68, averageX)),
    y: Math.max(0.32, Math.min(0.56, averageY + 0.02)),
  };
}

function asPercent(value: number) {
  return `${Math.max(0, Math.min(1, value)) * 100}%`;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
}

function getThumbnailZoom(candidate: GarmentCandidateChoice) {
  const boxSize = Math.max(candidate.boundingBox.width, candidate.boundingBox.height);
  const zoom = 1.25 / Math.max(0.24, boxSize);
  return Number(Math.max(2.2, Math.min(4.5, zoom)).toFixed(2));
}
