"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { GarmentCandidateChoice } from "@/src/domain/wardrobe";
import { getRuntimeMode } from "@/src/features/runtime/runtimeMode";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { DetectedGarmentCard } from "@/src/features/wardrobe/components/DetectedGarmentCard";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams<{ batchId: string }>();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const runtimeMode = getRuntimeMode();
  const {
    state,
    addGarment,
    deleteGarment,
    retryGarment,
    addAllGarments,
    loadRealBatch,
    addRealGarment,
    retryRealGarment,
    generateRealCandidates,
  } = useWardrobe();
  const isPersistentMode = runtimeMode === "real" || runtimeMode === "dev";
  const [isLoadingBatch, setIsLoadingBatch] = useState(isPersistentMode);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const garments = state.activeBatch?.detectedGarments ?? [];
  const isOutfitBatch = state.activeBatch?.sourceType === "outfit_photo";
  const candidateSummary = state.activeBatch?.candidateSummary;
  const candidateChoices = useMemo(() => state.activeBatch?.garmentCandidates ?? [], [state.activeBatch]);
  const hasCandidatePicker = isPersistentMode && isOutfitBatch && garments.length === 0 && candidateChoices.length > 0;
  const primaryCandidates = candidateChoices.filter((candidate) =>
    ["primary", "selected", "skipped_existing"].includes(candidate.selectionStatus),
  );
  const optionalCandidates = candidateChoices.filter((candidate) =>
    ["optional", "not_recommended"].includes(candidate.selectionStatus),
  );
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isPersistentMode) {
      return;
    }

    setIsLoadingBatch(true);
    setReviewError(null);

    void loadRealBatch(params.batchId)
      .catch((error) => {
        setReviewError(error instanceof Error ? error.message : "Could not load review items.");
      })
      .finally(() => {
        setIsLoadingBatch(false);
      });
  }, [isPersistentMode, loadRealBatch, params.batchId]);

  useEffect(() => {
    if (!hasCandidatePicker) {
      return;
    }

    setSelectedCandidateIds(
      candidateChoices
        .filter((candidate) => candidate.selectionStatus === "primary" || candidate.selectionStatus === "selected")
        .map((candidate) => candidate.id),
    );
  }, [candidateChoices, hasCandidatePicker]);

  async function handleAddAll() {
    if (isPersistentMode) {
      setIsUpdating(true);
      setReviewError(null);
      try {
        for (const garment of garments) {
          await addRealGarment(garment.id);
        }
        router.push("/closet");
      } catch (error) {
        setReviewError(error instanceof Error ? error.message : "Could not add all items.");
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    addAllGarments();
    router.push("/closet");
  }

  async function handleAdd(garmentId: string) {
    if (isPersistentMode) {
      setIsUpdating(true);
      setReviewError(null);
      try {
        await addRealGarment(garmentId);
      } catch (error) {
        setReviewError(error instanceof Error ? error.message : "Could not add item.");
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    addGarment(garmentId);
  }

  async function handleRetry(garmentId: string) {
    if (isPersistentMode) {
      setIsUpdating(true);
      setReviewError(null);
      try {
        await retryRealGarment(garmentId);
        await loadRealBatch(params.batchId);
      } catch (error) {
        setReviewError(error instanceof Error ? error.message : "Could not retry item.");
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    void retryGarment(garmentId);
  }

  async function handlePrepareSelectedCandidates() {
    if (!jobId) {
      setReviewError("Open this review from the processing screen to prepare selected pieces.");
      return;
    }
    if (selectedCandidateIds.length === 0) {
      setReviewError("Choose at least one piece to prepare.");
      return;
    }

    setIsUpdating(true);
    setReviewError(null);
    try {
      await generateRealCandidates(jobId, selectedCandidateIds);
      await loadRealBatch(params.batchId);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Could not prepare selected pieces.");
    } finally {
      setIsUpdating(false);
    }
  }

  function toggleCandidate(candidateId: string) {
    setSelectedCandidateIds((current) =>
      current.includes(candidateId) ? current.filter((id) => id !== candidateId) : [...current, candidateId],
    );
  }

  return (
    <AppShell>
      <div className="appbar">
        <Link className="button secondary" href="/upload">
          Close
        </Link>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            void handleAddAll();
          }}
          disabled={garments.length === 0 || isUpdating}
        >
          Add All
        </button>
      </div>

      <div className="stack">
        {reviewError ? (
          <p className="subtle" role="alert" style={{ color: "var(--wine)", marginTop: 0 }}>
            {reviewError}
          </p>
        ) : null}

        {isOutfitBatch && !isLoadingBatch ? (
          <section className="card" style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="pill dark">Outfit photo</span>
              <span className="pill">{garments.length} generated</span>
              {candidateSummary && candidateSummary.skippedCount + candidateSummary.failedCount > 0 ? (
                <span className="pill">
                  {candidateSummary.skippedCount + candidateSummary.failedCount} need another try
                </span>
              ) : null}
            </div>
            <p className="subtle" style={{ margin: 0 }}>
              Review each garment Wearabouts could confidently prepare from the source outfit.
            </p>
          </section>
        ) : null}

        {isLoadingBatch ? (
          <section className="card">
            <h1 className="app-title">Loading review</h1>
            <p className="subtle">Fetching the generated closet asset.</p>
          </section>
        ) : hasCandidatePicker ? (
          <section className="card" style={{ display: "grid", gap: 14 }}>
            <div>
              <h1 className="app-title" style={{ fontSize: 24 }}>Choose what to prepare</h1>
              <p className="subtle" style={{ margin: "6px 0 0" }}>
                Wearabouts found these pieces in the photo. New tops and bottoms are selected first.
              </p>
            </div>

            <CandidateChoiceList
              title="New closet pieces"
              candidates={primaryCandidates}
              selectedCandidateIds={selectedCandidateIds}
              onToggle={toggleCandidate}
            />

            {optionalCandidates.length > 0 ? (
              <CandidateChoiceList
                title="Optional"
                candidates={optionalCandidates}
                selectedCandidateIds={selectedCandidateIds}
                onToggle={toggleCandidate}
              />
            ) : null}

            <button
              type="button"
              className="full-button"
              disabled={isUpdating}
              onClick={() => {
                void handlePrepareSelectedCandidates();
              }}
            >
              {isUpdating ? "Preparing..." : "Prepare selected pieces"}
            </button>
          </section>
        ) : garments.length === 0 ? (
          <section className="card">
            <h1 className="app-title">Nothing left to review</h1>
            <p className="subtle">Approved items are now in your closet.</p>
            <Link className="full-button" href="/closet" style={{ display: "grid", placeItems: "center", marginTop: 16 }}>
              Go to closet
            </Link>
          </section>
        ) : (
          garments.map((garment) => (
            <DetectedGarmentCard
              key={garment.id}
              garment={garment}
              onAdd={(garmentId) => {
                void handleAdd(garmentId);
              }}
              onDelete={deleteGarment}
              onRetry={(garmentId) => {
                void handleRetry(garmentId);
              }}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}

function CandidateChoiceList({
  title,
  candidates,
  selectedCandidateIds,
  onToggle,
}: {
  title: string;
  candidates: GarmentCandidateChoice[];
  selectedCandidateIds: string[];
  onToggle: (candidateId: string) => void;
}) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <span
        style={{
          color: "var(--muted)",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
      {candidates.map((candidate) => {
        const isSelected = selectedCandidateIds.includes(candidate.id);
        const isOptional = candidate.selectionStatus === "optional" || candidate.selectionStatus === "not_recommended";
        const isDuplicate = candidate.selectionStatus === "skipped_existing";
        return (
          <button
            key={candidate.id}
            type="button"
            onClick={() => onToggle(candidate.id)}
            style={{
              width: "100%",
              border: `1px solid ${isSelected ? "var(--ink)" : "var(--line)"}`,
              borderRadius: 8,
              background: "var(--paper)",
              padding: 12,
              textAlign: "left",
              display: "grid",
              gridTemplateColumns: "24px minmax(0, 1fr)",
              gap: 10,
              alignItems: "start",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                border: `2px solid ${isSelected ? "var(--ink)" : "var(--muted)"}`,
                display: "grid",
                placeItems: "center",
                background: isSelected ? "var(--ink)" : "transparent",
                color: "var(--white)",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {isSelected ? "ok" : ""}
            </span>
            <span style={{ display: "grid", gap: 5 }}>
              <strong style={{ color: "var(--ink)", fontSize: 15 }}>{candidate.proposedName}</strong>
              <span className="subtle" style={{ fontSize: 13 }}>
                {isDuplicate
                  ? "Looks like something already in Closet. Select it if this is a different piece."
                  : candidate.selectionReason}
              </span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className={isDuplicate ? "pill" : isOptional ? "pill" : "pill dark"}>
                  {isDuplicate ? "Already in Closet" : isOptional ? "Optional" : "Selected first"}
                </span>
                <span className="pill">{candidate.category}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
