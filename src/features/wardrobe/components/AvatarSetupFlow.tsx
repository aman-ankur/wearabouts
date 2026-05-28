import React, { useMemo, useState } from "react";
import {
  canCompleteAvatarProfile,
  evaluateBodyInput,
  evaluateFaceInput,
} from "@/src/features/wardrobe/avatar/avatarValidation";
import type { AvatarInputKind, AvatarInputQualityCheck, AvatarStoredInput } from "@/src/features/wardrobe/avatar/avatarTypes";
import { AvatarInputReview } from "./AvatarInputReview";

export type AvatarSetupStep = "face" | "body" | "review";

interface AvatarSetupFlowProps {
  step: AvatarSetupStep;
  facePreviewUrl?: string | null;
  bodyPreviewUrl?: string | null;
  faceQuality?: AvatarInputQualityCheck | null;
  bodyQuality?: AvatarInputQualityCheck | null;
  uploadMode?: "local" | "direct";
  onSaveInput: (
    kind: AvatarInputKind,
    assetId: string,
    previewUrl: string,
    quality: AvatarInputQualityCheck,
    storedInput?: AvatarStoredInput,
  ) => void;
  onStepChange?: (step: AvatarSetupStep) => void;
  onComplete: () => void;
}

function inferFaceQuality(filename: string): AvatarInputQualityCheck {
  const name = filename.toLowerCase();
  return evaluateFaceInput({
    detectedFaceCount: name.includes("multi") ? 2 : name.includes("noface") || name.includes("bad") ? 0 : 1,
    faceVisible: !name.includes("noface") && !name.includes("bad"),
    sharp: !name.includes("blur"),
    wellLit: !name.includes("lowlight") && !name.includes("shadow"),
    occluded: name.includes("occluded") || name.includes("sunglasses"),
  });
}

function inferBodyQuality(filename: string): AvatarInputQualityCheck {
  const name = filename.toLowerCase();
  return evaluateBodyInput({
    detectedPersonCount: name.includes("multi") ? 2 : name.includes("nobody") ? 0 : 1,
    fullBodyVisible: !name.includes("cropped") && !name.includes("closeup") && !name.includes("bad"),
    standingPose: !name.includes("seated"),
    wellLit: !name.includes("lowlight") && !name.includes("shadow"),
    occluded: name.includes("occluded") || name.includes("blocked"),
    poseAngle: name.includes("side") ? "side" : name.includes("three") ? "three-quarter" : "front",
  });
}

function guidanceForStep(step: AvatarSetupStep): string[] {
  if (step === "face") {
    return ["Clear close-up", "Face visible and well lit", "One person", "No sunglasses or heavy obstruction"];
  }

  return ["Head-to-toe full body", "One person", "Good lighting", "Minimal occlusion", "Neutral standing pose"];
}

export function AvatarSetupFlow({
  step,
  facePreviewUrl,
  bodyPreviewUrl,
  faceQuality,
  bodyQuality,
  uploadMode = "local",
  onSaveInput,
  onStepChange,
  onComplete,
}: AvatarSetupFlowProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const canFinish = useMemo(
    () => Boolean(faceQuality && bodyQuality && canCompleteAvatarProfile(faceQuality, bodyQuality)),
    [bodyQuality, faceQuality],
  );
  const activeKind: AvatarInputKind = step === "body" ? "body" : "face";
  const title = step === "review" ? "Review Your Avatar" : activeKind === "face" ? "Face Pic" : "Body Pic";

  async function uploadAvatarInput(kind: AvatarInputKind, file: File): Promise<AvatarStoredInput> {
    const slotResponse = await fetch("/api/wardrobe/avatar/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, contentType: file.type }),
    });
    if (!slotResponse.ok) {
      const payload = (await slotResponse.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Could not prepare avatar upload.");
    }

    const slot = (await slotResponse.json()) as AvatarStoredInput & {
      signedUrl: string;
      token: string;
    };
    const formData = new FormData();
    formData.append("cacheControl", "3600");
    formData.append("", file);

    const uploadResponse = await fetch(slot.signedUrl, {
      method: "PUT",
      headers: { "x-upsert": "false" },
      body: formData,
    });
    if (!uploadResponse.ok) {
      throw new Error("Could not upload avatar photo.");
    }

    return { assetId: slot.assetId, storagePath: slot.storagePath, contentType: slot.contentType };
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      const quality = activeKind === "face" ? inferFaceQuality(file.name) : inferBodyQuality(file.name);
      if (quality.status === "failed") {
        onSaveInput(activeKind, `avatar-${activeKind}-${Date.now()}`, previewUrl, quality);
        return;
      }

      const storedInput = uploadMode === "direct" ? await uploadAvatarInput(activeKind, file) : undefined;
      onSaveInput(activeKind, storedInput?.assetId ?? `avatar-${activeKind}-${Date.now()}`, previewUrl, quality, storedInput);

      onStepChange?.(activeKind === "face" ? "body" : "review");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not upload avatar photo.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function uploadStatus() {
    if (isUploading) {
      return "Uploading avatar photo...";
    }

    const reasons = activeKind === "face" ? faceQuality?.reasons : bodyQuality?.reasons;
    return reasons?.length ? reasons.join(" ") : null;
  }

  const status = uploadStatus();

  if (step === "review") {
    return (
      <section style={{ display: "grid", gap: 12 }}>
        <div className="card" style={{ display: "grid", gap: 8 }}>
          <strong>{title}</strong>
          <p className="subtle" style={{ margin: 0 }}>
            These photos help Wearabouts create avatar previews. You can update them later.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
          <AvatarInputReview kind="face" previewUrl={facePreviewUrl ?? undefined} quality={faceQuality} onSwap={() => onStepChange?.("face")} />
          <AvatarInputReview kind="body" previewUrl={bodyPreviewUrl ?? undefined} quality={bodyQuality} onSwap={() => onStepChange?.("body")} />
        </div>
        <button type="button" className="full-button" disabled={!canFinish} onClick={onComplete}>
          Finish
        </button>
      </section>
    );
  }

  return (
    <section className="card" style={{ display: "grid", gap: 12 }}>
      <div>
        <strong>{title}</strong>
        <p className="subtle" style={{ margin: "4px 0 0" }}>
          {activeKind === "face"
            ? "Use a clear face photo for recognizable likeness."
            : "Use a full-body photo for proportions and stance."}
        </p>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
        {guidanceForStep(step).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <input type="file" accept="image/png,image/jpeg,image/webp" aria-label={`Upload ${title}`} disabled={isUploading} onChange={handleFileChange} />
      {status ? (
        <p className="subtle" role="status" style={{ margin: 0 }}>
          {status}
        </p>
      ) : null}
      {uploadError ? (
        <p className="subtle" role="alert" style={{ margin: 0 }}>
          {uploadError}
        </p>
      ) : null}
    </section>
  );
}
