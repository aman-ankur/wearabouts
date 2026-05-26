"use client";

import { FileImage, Images, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { UploadSourceType } from "@/src/domain/wardrobe";
import { getRuntimeMode, getRuntimeModeLabel, setRuntimeModeOverride } from "@/src/features/runtime/runtimeMode";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { PrettifyExplainer } from "@/src/features/wardrobe/components/PrettifyExplainer";
import { UploadChoiceCard } from "@/src/features/wardrobe/components/UploadChoiceCard";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function UploadPage() {
  const router = useRouter();
  const { createDemoBatch } = useWardrobe();
  const [runtimeMode, setRuntimeMode] = useState(() => getRuntimeMode());
  const [selectedSourceType, setSelectedSourceType] = useState<Extract<UploadSourceType, "item_photo" | "outfit_photo">>(
    "item_photo",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isDevMode = runtimeMode === "dev";

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
      setUploadError("Choose one clothing photo first.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("item_photo", selectedFile);
      formData.append("source_type", selectedSourceType);

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
            <h1 className="app-title">Add To Closet</h1>
            <p className="subtle">
              {isDevMode
                ? "Upload anything to reuse cached closet assets without calling OpenAI."
                : "Upload an item photo or outfit photo. Wearabouts will prep review cards."}
            </p>
          </div>
          <button type="button" className="button secondary" onClick={handleToggleDevMode}>
            {isDevMode ? "Real" : "Dev"}
          </button>
        </div>

        <div className="stack">
          <form className="card" onSubmit={handleRealUpload} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="pill dark">
                <Sparkles size={14} /> {isDevMode ? "Dev Cache Mode" : "Real Auto-Prettify"}
              </span>
              <span className="pill">
                {getRuntimeModeLabel(runtimeMode)}
              </span>
            </div>

            <div
              role="tablist"
              aria-label="Upload type"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {[
                {
                  sourceType: "item_photo" as const,
                  label: "Item photo",
                  description: "One garment",
                  icon: FileImage,
                },
                {
                  sourceType: "outfit_photo" as const,
                  label: "Outfit photo",
                  description: "Multiple garments",
                  icon: Images,
                },
              ].map((choice) => {
                const Icon = choice.icon;
                const isSelected = selectedSourceType === choice.sourceType;

                return (
                  <button
                    key={choice.sourceType}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={isSelected ? "button secondary" : "button ghost"}
                    onClick={() => {
                      setSelectedSourceType(choice.sourceType);
                      setSelectedFile(null);
                      setUploadError(null);
                    }}
                    style={{ minHeight: 58, justifyContent: "flex-start" }}
                  >
                    <Icon size={17} />
                    <span style={{ display: "grid", gap: 2, textAlign: "left" }}>
                      <strong>{choice.label}</strong>
                      <span style={{ fontSize: 12 }}>{choice.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <label
              htmlFor="item_photo"
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: 190,
                border: "1px dashed var(--line)",
                borderRadius: 8,
                background: "var(--paper)",
                textAlign: "center",
                padding: 18,
              }}
            >
              {selectedSourceType === "outfit_photo" ? <Images size={34} /> : <FileImage size={34} />}
              <strong style={{ marginTop: 10 }}>
                {selectedSourceType === "outfit_photo" ? "Outfit photo" : "Item photo"}
              </strong>
              <span className="subtle">
                {selectedFile
                  ? selectedFile.name
                  : isDevMode
                    ? "Choose a file to exercise upload UI; cached output is reused."
                    : "Choose a JPG, PNG, or WebP under 10MB."}
              </span>
              <input
                id="item_photo"
                name="item_photo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              />
            </label>

            {uploadError ? (
              <p className="subtle" role="alert" style={{ color: "var(--wine)", margin: 0 }}>
                {uploadError}
              </p>
            ) : null}

            <button type="submit" className="full-button" disabled={isUploading}>
              {isUploading
                ? "Starting..."
                : isDevMode
                  ? selectedSourceType === "outfit_photo"
                    ? "Upload and Use Multi-Card Cache"
                    : "Upload and Use Cache"
                  : selectedSourceType === "outfit_photo"
                    ? "Upload and Detect Outfit"
                    : "Upload and Prettify"}
            </button>
          </form>

          <section className="card" style={{ opacity: 0.72 }}>
            <strong>Batch upload</strong>
            <p className="subtle" style={{ marginBottom: 0 }}>
              Bulk closet import comes after outfit decomposition is reliable.
            </p>
          </section>

          <PrettifyExplainer />
        </div>

        <BottomNav />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Add To Closet</h1>
          <p className="subtle">Choose a demo upload type. Auto-Prettify runs before review.</p>
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
