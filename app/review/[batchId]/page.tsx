"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { GarmentCandidateChoice, UploadSourceImageReference } from "@/src/domain/wardrobe";
import { getRuntimeMode } from "@/src/features/runtime/runtimeMode";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import {
  CandidateCropThumbnail,
  CandidateNumber,
  DetectedCandidatePhotoReference,
} from "@/src/features/wardrobe/components/DetectedCandidatePhotoReference";
import { CandidateGenerationProgress } from "@/src/features/wardrobe/components/CandidateGenerationProgress";
import { DetectedGarmentCard } from "@/src/features/wardrobe/components/DetectedGarmentCard";
import { logWearaboutsClientEvent } from "@/src/features/wardrobe/real/clientTelemetry";
import {
  getDefaultSelectedReviewCandidateIds,
  getReviewCandidateStatusMessage,
  shouldShowReviewCandidatePicker,
} from "@/src/features/wardrobe/review/reviewCandidateSelection";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function ReviewPage() {
  const params = useParams<{ batchId: string }>();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const runtimeMode = getRuntimeMode();
  const {
    state,
    addGarment,
    addAllGarments,
    deleteGarment,
    retryGarment,
    loadRealBatch,
    addRealGarment,
    addAllRealGarments,
    retryRealGarment,
    generateRealCandidates,
  } = useWardrobe();
  const isPersistentMode = runtimeMode === "real" || runtimeMode === "dev";
  const [isLoadingBatch, setIsLoadingBatch] = useState(isPersistentMode);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingCandidates, setIsGeneratingCandidates] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const garments = state.activeBatch?.detectedGarments ?? [];
  const isOutfitBatch = state.activeBatch?.sourceType === "outfit_photo";
  const candidateSummary = state.activeBatch?.candidateSummary;
  const candidateChoices = useMemo(() => state.activeBatch?.garmentCandidates ?? [], [state.activeBatch]);
  const ungeneratedCandidateChoices = useMemo(
    () => candidateChoices.filter((candidate) => candidate.status !== "ready"),
    [candidateChoices],
  );
  const primaryCandidates = useMemo(
    () =>
      ungeneratedCandidateChoices.filter((candidate) =>
        ["primary", "selected"].includes(candidate.selectionStatus),
      ),
    [ungeneratedCandidateChoices],
  );
  const optionalCandidates = useMemo(
    () =>
      ungeneratedCandidateChoices.filter((candidate) =>
        ["optional", "not_recommended", "skipped_existing"].includes(candidate.selectionStatus),
      ),
    [ungeneratedCandidateChoices],
  );
  const hasCandidatePicker =
    shouldShowReviewCandidatePicker({
      isPersistentMode,
      isOutfitBatch,
      garmentCount: garments.length,
      candidates: candidateChoices,
    });
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isSourcePhotoExpanded, setIsSourcePhotoExpanded] = useState(false);
  const candidateIndexById = useMemo(
    () => new Map(candidateChoices.map((candidate, index) => [candidate.id, index])),
    [candidateChoices],
  );
  const selectedCandidateChoices = useMemo(
    () => candidateChoices.filter((candidate) => selectedCandidateIds.includes(candidate.id)),
    [candidateChoices, selectedCandidateIds],
  );
  const generateSelectedLabel =
    selectedCandidateIds.length === 0
      ? "Choose items to generate"
      : selectedCandidateIds.length === 1
        ? "Generate 1 wardrobe item"
        : `Generate ${selectedCandidateIds.length} wardrobe items`;

  useEffect(() => {
    if (!isPersistentMode) {
      return;
    }

    setIsLoadingBatch(true);
    setReviewError(null);
    logWearaboutsClientEvent("review.batch_load.started", {
      batchId: params.batchId,
      runtimeMode,
    });

    void loadRealBatch(params.batchId)
      .then((batch) => {
        logWearaboutsClientEvent("review.batch_load.completed", {
          batchId: batch.id,
          sourceType: batch.sourceType,
          garmentCount: batch.detectedGarments.length,
          candidateCount: batch.garmentCandidates?.length ?? 0,
          generatedCandidateCount: batch.candidateSummary?.generatedCount ?? 0,
          skippedCandidateCount: batch.candidateSummary?.skippedCount ?? 0,
          failedCandidateCount: batch.candidateSummary?.failedCount ?? 0,
        });
      })
      .catch((error) => {
        logWearaboutsClientEvent("review.batch_load.failed", {
          batchId: params.batchId,
          error: error instanceof Error ? error.message : "Could not load review items.",
        });
        setReviewError(error instanceof Error ? error.message : "Could not load review items.");
      })
      .finally(() => {
        setIsLoadingBatch(false);
      });
  }, [isPersistentMode, loadRealBatch, params.batchId, runtimeMode]);

  useEffect(() => {
    if (!hasCandidatePicker || isGeneratingCandidates) {
      return;
    }

    const defaultIds = getDefaultSelectedReviewCandidateIds(candidateChoices);
    logWearaboutsClientEvent("review.candidate_picker.defaulted", {
      batchId: params.batchId,
      candidateCount: candidateChoices.length,
      selectedCandidateCount: defaultIds.length,
      selectedCandidateIds: defaultIds,
    });
    setSelectedCandidateIds(defaultIds);
  }, [candidateChoices, hasCandidatePicker, isGeneratingCandidates, params.batchId]);

  useEffect(() => {
    if (!isPersistentMode || !isGeneratingCandidates) {
      return;
    }

    void loadRealBatch(params.batchId).catch(() => undefined);
    const intervalId = window.setInterval(() => {
      void loadRealBatch(params.batchId).catch(() => undefined);
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [isGeneratingCandidates, isPersistentMode, loadRealBatch, params.batchId]);

  async function handleAdd(garmentId: string) {
    if (isPersistentMode) {
      setIsUpdating(true);
      setReviewError(null);
      logWearaboutsClientEvent("review.garment_add.started", { batchId: params.batchId, garmentId });
      try {
        const wardrobeItem = await addRealGarment(garmentId);
        logWearaboutsClientEvent("review.garment_add.completed", {
          batchId: params.batchId,
          garmentId,
          wardrobeItemId: wardrobeItem.id,
        });
      } catch (error) {
        logWearaboutsClientEvent("review.garment_add.failed", {
          batchId: params.batchId,
          garmentId,
          error: error instanceof Error ? error.message : "Could not add item.",
        });
        setReviewError(error instanceof Error ? error.message : "Could not add item.");
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    addGarment(garmentId);
  }

  async function handleAddAll() {
    if (garments.length === 0) {
      return;
    }

    if (isPersistentMode) {
      setIsUpdating(true);
      setReviewError(null);
      logWearaboutsClientEvent("review.add_all.started", {
        batchId: params.batchId,
        garmentCount: garments.length,
      });
      try {
        await addAllRealGarments();
        logWearaboutsClientEvent("review.add_all.completed", {
          batchId: params.batchId,
          garmentCount: garments.length,
        });
      } catch (error) {
        logWearaboutsClientEvent("review.add_all.failed", {
          batchId: params.batchId,
          garmentCount: garments.length,
          error: error instanceof Error ? error.message : "Could not add all items.",
        });
        setReviewError(error instanceof Error ? error.message : "Could not add all items.");
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    addAllGarments();
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
      setReviewError("Open this review from the processing screen to generate selected items.");
      return;
    }
    if (selectedCandidateIds.length === 0) {
      setReviewError("Choose at least one item to generate.");
      return;
    }

    setIsUpdating(true);
    setIsGeneratingCandidates(true);
    setReviewError(null);
    logWearaboutsClientEvent("review.selected_candidates.started", {
      batchId: params.batchId,
      jobId,
      selectedCandidateIds,
    });
    try {
      await generateRealCandidates(jobId, selectedCandidateIds);
      const batch = await loadRealBatch(params.batchId);
      logWearaboutsClientEvent("review.selected_candidates.completed", {
        batchId: params.batchId,
        jobId,
        selectedCandidateCount: selectedCandidateIds.length,
        garmentCount: batch.detectedGarments.length,
      });
    } catch (error) {
      logWearaboutsClientEvent("review.selected_candidates.failed", {
        batchId: params.batchId,
        jobId,
        selectedCandidateIds,
        error: error instanceof Error ? error.message : "Could not generate selected items.",
      });
      setReviewError(error instanceof Error ? error.message : "Could not generate selected items.");
    } finally {
      setIsGeneratingCandidates(false);
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
      <div className="stack">
        {reviewError ? (
          <p className="subtle" role="alert" style={{ color: "var(--wine)", marginTop: 0 }}>
            {reviewError}
          </p>
        ) : null}

        {isOutfitBatch && !isLoadingBatch && !hasCandidatePicker && garments.length > 0 ? (
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
              Review each item Wearabouts generated from the source outfit.
            </p>
            <CandidateGenerationProgress
              isGenerating={isGeneratingCandidates}
              generatedCount={garments.length}
              candidates={selectedCandidateChoices}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              <button type="button" className="button" disabled={isUpdating} onClick={() => void handleAddAll()}>
                {isUpdating ? "Adding..." : "Add all"}
              </button>
              <Link className="button secondary" href="/closet">
                Back to wardrobe
              </Link>
            </div>
          </section>
        ) : null}

        {isLoadingBatch ? (
          <section className="card">
            <h1 className="app-title">Loading review</h1>
            <p className="subtle">Fetching the generated wardrobe item.</p>
          </section>
        ) : hasCandidatePicker ? (
          <section className="card" style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
              <div>
                <h1 className="app-title" style={{ fontSize: 24 }}>Choose items for Wardrobe</h1>
                <p className="subtle" style={{ margin: "6px 0 0" }}>
                  Select the pieces Wearabouts should turn into clean wardrobe items. Topwear and bottomwear appear
                  first so outfits are easier to build.
                </p>
              </div>
              <Link className="button secondary" href="/upload" style={{ minHeight: 36, padding: "9px 13px" }}>
                Back
              </Link>
            </div>

            {state.activeBatch?.sourceImage ? (
              <DetectedCandidatePhotoReference
                sourceImage={state.activeBatch.sourceImage}
                candidates={candidateChoices}
                expanded={isSourcePhotoExpanded}
                onToggleExpanded={() => setIsSourcePhotoExpanded((current) => !current)}
              />
            ) : null}

            <section
              style={{
                border: "1px solid rgba(17,17,17,0.12)",
                borderRadius: 8,
                background: "linear-gradient(135deg, rgba(17,17,17,0.03), rgba(255,255,255,0.92))",
                padding: "12px 13px",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <span style={{ display: "grid", gap: 3 }}>
                <strong style={{ color: "var(--ink)", fontSize: 15, lineHeight: 1.2 }}>
                  Wardrobe matching
                </strong>
                <span className="subtle" style={{ fontSize: 13 }}>
                  Pieces that look saved stay optional.
                </span>
              </span>
              <span
                aria-label="Wardrobe matching is on"
                style={{
                  borderRadius: 999,
                  background: "var(--ink)",
                  color: "var(--white)",
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 850,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  boxShadow: "0 6px 16px rgba(17,17,17,0.14)",
                }}
              >
                On
              </span>
            </section>

            <CandidateChoiceList
              title="Ready to generate"
              candidates={primaryCandidates}
              selectedCandidateIds={selectedCandidateIds}
              sourceImage={state.activeBatch?.sourceImage}
              candidateIndexById={candidateIndexById}
              onToggle={toggleCandidate}
            />

            {optionalCandidates.length > 0 ? (
              <CandidateChoiceList
                title="Looks already saved"
                candidates={optionalCandidates}
                selectedCandidateIds={selectedCandidateIds}
                sourceImage={state.activeBatch?.sourceImage}
                candidateIndexById={candidateIndexById}
                onToggle={toggleCandidate}
              />
            ) : null}

            <CandidateGenerationProgress
              isGenerating={isGeneratingCandidates}
              generatedCount={garments.length}
              candidates={selectedCandidateChoices}
            />

            <button
              type="button"
              className="full-button"
              disabled={isUpdating || selectedCandidateIds.length === 0}
              onClick={() => {
                void handlePrepareSelectedCandidates();
              }}
            >
              {isUpdating ? "Generating wardrobe items..." : generateSelectedLabel}
            </button>
          </section>
        ) : garments.length === 0 ? (
          <section className="card">
            <h1 className="app-title">Nothing left to review</h1>
            <p className="subtle">Approved items are now in your wardrobe.</p>
            <Link className="full-button" href="/closet" style={{ display: "grid", placeItems: "center", marginTop: 16 }}>
              Go to wardrobe
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
  sourceImage,
  candidateIndexById,
  onToggle,
}: {
  title: string;
  candidates: GarmentCandidateChoice[];
  selectedCandidateIds: string[];
  sourceImage?: UploadSourceImageReference;
  candidateIndexById: Map<string, number>;
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
        const isFailed = candidate.status === "failed";
        const candidateIndex = candidateIndexById.get(candidate.id) ?? 0;
        const rowBackground =
          isSelected || (!isOptional && !isDuplicate) ? "var(--paper)" : "rgba(255,255,255,0.72)";
        const statusLabel = isFailed ? "Blocked" : isDuplicate ? "Already saved" : isSelected ? "Selected" : "Optional";
        return (
          <button
            key={candidate.id}
            type="button"
            onClick={() => onToggle(candidate.id)}
            aria-pressed={isSelected}
            style={{
              width: "100%",
              border: `1px solid ${isSelected ? "var(--ink)" : "var(--line)"}`,
              borderRadius: 8,
              background: rowBackground,
              padding: 12,
              textAlign: "left",
              display: "grid",
              gridTemplateColumns: sourceImage ? "24px 52px minmax(0, 1fr)" : "24px minmax(0, 1fr)",
              gap: 10,
              alignItems: "center",
              boxShadow: isSelected ? "0 8px 22px rgba(17,17,17,0.05)" : "none",
              opacity: isSelected || !isOptional ? 1 : 0.86,
            }}
          >
            <CandidateNumber index={candidateIndex} variant="neutral" />
            <CandidateCropThumbnail sourceImage={sourceImage} candidate={candidate} />
            <span style={{ display: "grid", gap: 5, minWidth: 0 }}>
              <strong style={{ color: "var(--ink)", fontSize: 15, lineHeight: 1.2 }}>{candidate.proposedName}</strong>
              <span className="subtle" style={{ fontSize: 13 }}>
                {isDuplicate
                  ? "Looks like something already in Wardrobe. Select it if this is a different piece."
                  : getReviewCandidateStatusMessage(candidate)}
              </span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span
                  className="pill"
                  style={{
                    background: isSelected ? "var(--ink)" : "var(--wash)",
                    color: isSelected ? "var(--white)" : "var(--muted)",
                    border: `1px solid ${isSelected ? "var(--ink)" : "transparent"}`,
                  }}
                >
                  {statusLabel}
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
