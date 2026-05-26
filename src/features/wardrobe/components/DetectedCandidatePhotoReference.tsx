import React from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import type { GarmentCandidateChoice, GarmentCategory, UploadSourceImageReference } from "@/src/domain/wardrobe";

interface DetectedCandidatePhotoReferenceProps {
  sourceImage: UploadSourceImageReference;
  candidates: GarmentCandidateChoice[];
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const categoryLabels: Record<GarmentCategory, string> = {
  tops: "Top",
  bottoms: "Pants",
  outerwear: "Layer",
  footwear: "Shoes",
  accessories: "Accessory",
  combo: "Outfit",
};

const candidateColors = ["#48614c", "#245c91", "#9a7236", "#9d3146", "#5f5597", "#62605b"];

export function DetectedCandidatePhotoReference({
  sourceImage,
  candidates,
  expanded = false,
  onToggleExpanded,
}: DetectedCandidatePhotoReferenceProps) {
  const visibleCandidates = candidates.filter((candidate) => candidate.boundingBox);

  if (visibleCandidates.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        display: "grid",
        gap: 12,
        padding: 14,
        border: "1px solid var(--line)",
        borderRadius: 8,
        background: "var(--panel)",
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
              border: 0,
              background: "transparent",
              padding: 0,
              color: "var(--ink)",
              fontWeight: 850,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              whiteSpace: "nowrap",
            }}
          >
            {expanded ? "Photo shown" : "View larger"}
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
        }}
      >
        <Image
          src={sourceImage.imageUrl}
          alt={`Uploaded photo ${sourceImage.originalFilename}`}
          width={720}
          height={960}
          unoptimized
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />
        {visibleCandidates.map((candidate, index) => (
          <DetectionMarker key={candidate.id} candidate={candidate} index={index} />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {visibleCandidates.slice(0, 6).map((candidate, index) => (
          <span
            key={candidate.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              color: "var(--muted)",
              fontSize: 12,
              lineHeight: 1.2,
              minWidth: 0,
            }}
          >
            <CandidateNumber index={index} />
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {categoryLabels[candidate.category]}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}

export function CandidateCropThumbnail({
  sourceImage,
  candidate,
}: {
  sourceImage?: UploadSourceImageReference;
  candidate: GarmentCandidateChoice;
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
        width: 52,
        height: 52,
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
        sizes="52px"
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
        width: 21,
        height: 21,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: isNeutral ? "var(--wash)" : isSolid ? color : hexToRgba(color, 0.14),
        color: isNeutral ? "var(--ink)" : isSolid ? "var(--white)" : color,
        border: isNeutral
          ? "1px solid rgba(17,17,17,0.12)"
          : isSolid
            ? "1px solid transparent"
            : `1px solid ${hexToRgba(color, 0.22)}`,
        fontSize: 11,
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

function DetectionMarker({ candidate, index }: { candidate: GarmentCandidateChoice; index: number }) {
  const color = getCandidateColor(index);
  const centerX = candidate.boundingBox.x + candidate.boundingBox.width / 2;
  const centerY = candidate.boundingBox.y + candidate.boundingBox.height / 2;
  const style: CSSProperties = {
    position: "absolute",
    left: asPercent(centerX),
    top: asPercent(centerY),
    width: 26,
    height: 26,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 2,
  };

  return (
    <span aria-label={`${candidate.proposedName} detected area`} style={style}>
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 22,
          borderTop: `1.5px dotted ${hexToRgba(color, 0.55)}`,
          transform: "translateY(-50%)",
          opacity: 0.72,
        }}
      />
      <span
        style={{
          position: "relative",
          width: 25,
          height: 25,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: hexToRgba(color, 0.78),
          color: "var(--white)",
          fontSize: 12,
          fontWeight: 900,
          border: "1px solid rgba(255,255,255,0.68)",
          boxShadow: "0 4px 14px rgba(17,17,17,0.18)",
          backdropFilter: "blur(3px)",
        }}
      >
        {index + 1}
      </span>
    </span>
  );
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
