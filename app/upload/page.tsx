"use client";

import { FileImage, Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { UploadSourceType } from "@/src/domain/wardrobe";
import { getRuntimeMode } from "@/src/features/runtime/runtimeMode";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { PrettifyExplainer } from "@/src/features/wardrobe/components/PrettifyExplainer";
import { UploadChoiceCard } from "@/src/features/wardrobe/components/UploadChoiceCard";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function UploadPage() {
  const router = useRouter();
  const { createDemoBatch } = useWardrobe();
  const runtimeMode = getRuntimeMode();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

      const response = await fetch("/api/wardrobe/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { batchId?: string; jobId?: string; error?: string };

      if (!response.ok || !payload.batchId || !payload.jobId) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      router.push(`/processing/${payload.jobId}?batchId=${payload.batchId}`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  if (runtimeMode === "real") {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Add To Closet</h1>
            <p className="subtle">Upload one standalone clothing photo. Wearabouts will prep it for review.</p>
          </div>
        </div>

        <div className="stack">
          <form className="card" onSubmit={handleRealUpload} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="pill dark">
                <Sparkles size={14} /> Real Auto-Prettify
              </span>
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
              <FileImage size={34} />
              <strong style={{ marginTop: 10 }}>Item photo</strong>
              <span className="subtle">
                {selectedFile ? selectedFile.name : "Choose a JPG, PNG, or WebP under 10MB."}
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
              {isUploading ? "Starting..." : "Upload and Prettify"}
            </button>
          </form>

          {[
            ["Outfit photo", "Multi-garment detection comes after this proof."],
            ["Batch upload", "Bulk closet import comes after single-item reliability."],
          ].map(([title, description]) => (
            <section
              key={title}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                opacity: 0.72,
              }}
            >
              <div>
                <strong>{title}</strong>
                <p className="subtle" style={{ marginBottom: 0 }}>
                  {description}
                </p>
              </div>
              <Lock size={18} />
            </section>
          ))}

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
