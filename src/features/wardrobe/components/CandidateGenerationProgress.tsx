import React from "react";
import type { GarmentCandidateChoice } from "@/src/domain/wardrobe";

type CandidateProgressItem = Pick<GarmentCandidateChoice, "id" | "status">;

interface CandidateGenerationProgressProps {
  isGenerating: boolean;
  generatedCount: number;
  candidates: CandidateProgressItem[];
}

export function CandidateGenerationProgress({
  isGenerating,
  generatedCount,
  candidates,
}: CandidateGenerationProgressProps) {
  if (!isGenerating) {
    return null;
  }

  const readyCount = Math.max(generatedCount, candidates.filter((candidate) => candidate.status === "ready").length);
  const preparingCount = candidates.filter(
    (candidate) => candidate.status === "detected" || candidate.status === "prettifying",
  ).length;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        border: "1px solid rgba(17,17,17,0.12)",
        borderRadius: 8,
        background: "rgba(255,255,255,0.76)",
        padding: "12px 13px",
        display: "grid",
        gap: 5,
      }}
    >
      <strong style={{ color: "var(--ink)", fontSize: 15, lineHeight: 1.2 }}>
        {readyCount} {readyCount === 1 ? "item" : "items"} ready
        {preparingCount > 0 ? `, ${preparingCount} still preparing` : ""}
      </strong>
      <span className="subtle" style={{ fontSize: 13 }}>
        You can review finished items while the rest keep processing.
      </span>
    </div>
  );
}
