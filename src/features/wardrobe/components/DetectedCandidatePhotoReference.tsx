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
          <DetectionBox key={candidate.id} candidate={candidate} index={index} />
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
          transform: "scale(1.45)",
        }}
      />
    </span>
  );
}

export function CandidateNumber({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: getCandidateColor(index),
        color: "var(--white)",
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

function DetectionBox({ candidate, index }: { candidate: GarmentCandidateChoice; index: number }) {
  const color = getCandidateColor(index);
  const style: CSSProperties = {
    position: "absolute",
    left: asPercent(candidate.boundingBox.x),
    top: asPercent(candidate.boundingBox.y),
    width: asPercent(candidate.boundingBox.width),
    height: asPercent(candidate.boundingBox.height),
    border: `2px solid ${color}`,
    borderRadius: 8,
    boxShadow: "0 0 0 999px rgba(17, 17, 17, 0.025)",
    pointerEvents: "none",
  };

  return (
    <span aria-label={`${candidate.proposedName} detected area`} style={style}>
      <span
        style={{
          position: "absolute",
          top: -13,
          left: -10,
          width: 26,
          height: 26,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: color,
          color: "var(--white)",
          fontSize: 12,
          fontWeight: 900,
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
