"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRuntimeMode } from "@/src/features/runtime/runtimeMode";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { DetectedGarmentCard } from "@/src/features/wardrobe/components/DetectedGarmentCard";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams<{ batchId: string }>();
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
  } = useWardrobe();
  const isPersistentMode = runtimeMode === "real" || runtimeMode === "dev";
  const [isLoadingBatch, setIsLoadingBatch] = useState(isPersistentMode);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const garments = state.activeBatch?.detectedGarments ?? [];
  const isOutfitBatch = state.activeBatch?.sourceType === "outfit_photo";
  const candidateSummary = state.activeBatch?.candidateSummary;

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
