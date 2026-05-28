"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { OutfitExtractionMode, UploadSourceType } from "@/src/domain/wardrobe";
import { getRuntimeMode, getRuntimeModeLabel, setRuntimeModeOverride } from "@/src/features/runtime/runtimeMode";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { PrettifyExplainer } from "@/src/features/wardrobe/components/PrettifyExplainer";
import { UploadChoiceCard } from "@/src/features/wardrobe/components/UploadChoiceCard";
import { UploadPhotoInput } from "@/src/features/wardrobe/components/UploadPhotoInput";
import { getOutfitExtractionOption, outfitExtractionOptions } from "@/src/features/wardrobe/real/outfitExtractionOptions";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function UploadPage() {
  const router = useRouter();
  const { createDemoBatch } = useWardrobe();
  const [runtimeMode, setRuntimeMode] = useState(() => getRuntimeMode());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionMode, setExtractionMode] = useState<OutfitExtractionMode>("pick_after_scan");
  const [skipExistingItems, setSkipExistingItems] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isDevMode = runtimeMode === "dev";
  const selectedExtractionOption = getOutfitExtractionOption(extractionMode);

  async function handleChoose(sourceType: UploadSourceType) {
    const batchId = await createDemoBatch(sourceType);
    router.push(`/review/${batchId}`);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setUploadError(null);
  }

  async function handleRealUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setUploadError("Choose or take one clothing photo first.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("item_photo", selectedFile);
      formData.append("source_type", "outfit_photo");
      formData.append("extraction_mode", extractionMode);
      formData.append("skip_existing_items", String(skipExistingItems));

      const response = await fetch(isDevMode ? "/api/wardrobe/dev/uploads" : "/api/wardrobe/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { batchId?: string; jobId?: string; error?: string };

      if (!response.ok || !payload.batchId || (!isDevMode && !payload.jobId)) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      router.push(isDevMode ? `/review/${payload.batchId}` : `/processing/${payload.jobId}?batchId=${payload.batchId}`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleToggleDevMode() {
    setSelectedFile(null);
    setUploadError(null);
    setRuntimeMode(setRuntimeModeOverride(isDevMode ? null : "dev"));
  }

  if (runtimeMode === "real" || runtimeMode === "dev") {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title" style={{ fontSize: 26 }}>Add clothing</h1>
            <p className="subtle" style={{ fontSize: 14 }}>
              {isDevMode
                ? "Try the review flow with cached wardrobe items."
                : "Upload one clear item or a full outfit. Review each garment before it enters Wardrobe."}
            </p>
          </div>
          <button type="button" className="button secondary" onClick={handleToggleDevMode} style={{ minHeight: 38 }}>
            {isDevMode ? "Real" : "Dev"}
          </button>
        </div>

        <div className="stack">
          <form className="card" onSubmit={handleRealUpload} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Wardrobe Prep
              </span>
              <span className="pill">{getRuntimeModeLabel(runtimeMode)}</span>
            </div>

            <UploadPhotoInput selectedFileName={selectedFile?.name ?? null} onFileChange={handleFileChange} />

            {uploadError ? (
              <p className="subtle" role="alert" style={{ color: "var(--wine)", margin: 0 }}>
                {uploadError}
              </p>
            ) : null}

            <section style={{ display: "grid", gap: 9 }}>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Prepare mode
              </span>
              <div className="upload-mode-grid" role="group" aria-label="Choose what Wearabouts should prepare">
                {outfitExtractionOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setExtractionMode(option.id)}
                    className={`upload-mode-button${extractionMode === option.id ? " upload-mode-button-active" : ""}`}
                    aria-pressed={extractionMode === option.id}
                  >
                    {option.shortLabel}
                  </button>
                ))}
              </div>
              <p className="upload-mode-summary">
                <strong>{selectedExtractionOption.title}:</strong> {selectedExtractionOption.description}
              </p>
              <button
                type="button"
                className={`upload-skip-toggle${skipExistingItems ? " upload-skip-toggle-active" : ""}`}
                aria-pressed={skipExistingItems}
                onClick={() => setSkipExistingItems((current) => !current)}
              >
                <span>
                  <strong>Wardrobe matching</strong>
                  <small>{skipExistingItems ? "Skip likely saved items" : "Include likely saved items"}</small>
                </span>
                <span className="upload-skip-switch" aria-hidden="true" />
              </button>
            </section>

            <button type="submit" className="full-button" disabled={isUploading} style={{ minHeight: 50, fontSize: 15 }}>
              {isUploading ? "Starting..." : isDevMode ? "Use cached result" : "Process photo"}
            </button>
          </form>

        </div>

        <BottomNav />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Add To Wardrobe</h1>
          <p className="subtle">Choose a demo upload type. Wardrobe Prep runs before review.</p>
        </div>
      </div>

      <div className="stack">
        <UploadChoiceCard
          title="Outfit photo"
          description="Detect visible garments from a photo of you wearing them."
          sourceType="outfit_photo"
          onChoose={handleChoose}
        />
        <UploadChoiceCard
          title="Item photo"
          description="Best for a single garment on a hanger, bed, or wall."
          sourceType="item_photo"
          onChoose={handleChoose}
        />
        <UploadChoiceCard
          title="Batch upload"
          description="Review several detected wardrobe items together."
          sourceType="batch_upload"
          onChoose={handleChoose}
        />
        <PrettifyExplainer />
      </div>

      <BottomNav />
    </AppShell>
  );
}
