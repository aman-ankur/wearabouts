"use client";

import { FileImage } from "lucide-react";
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
      formData.append("source_type", "outfit_photo");

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
                ? "Try the review flow with cached closet assets."
                : "Upload one clear item or a full outfit. Review each garment before it enters Closet."}
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
                Auto-Prettify
              </span>
              <span className="pill">{getRuntimeModeLabel(runtimeMode)}</span>
            </div>

            <label
              htmlFor="item_photo"
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: 178,
                border: "1px dashed var(--line)",
                borderRadius: 8,
                background: "var(--paper)",
                textAlign: "center",
                padding: 22,
              }}
            >
              <FileImage size={34} />
              <strong style={{ marginTop: 10, fontSize: 18 }}>Choose photo</strong>
              <span className="subtle" style={{ fontSize: 14 }}>
                {selectedFile ? selectedFile.name : "JPG, PNG, or WebP under 10MB"}
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

            <button type="submit" className="full-button" disabled={isUploading} style={{ minHeight: 50, fontSize: 15 }}>
              {isUploading ? "Starting..." : isDevMode ? "Use cached result" : "Upload photo"}
            </button>

            <div style={{ display: "grid", gap: 8 }}>
              <p className="subtle" style={{ margin: 0, fontSize: 13 }}>
                <strong style={{ color: "var(--ink)" }}>One garment:</strong> Wearabouts creates one review card.
              </p>
              <p className="subtle" style={{ margin: 0, fontSize: 13 }}>
                <strong style={{ color: "var(--ink)" }}>Full outfit:</strong> visible pieces become separate cards when
                confidence is high.
              </p>
            </div>
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
