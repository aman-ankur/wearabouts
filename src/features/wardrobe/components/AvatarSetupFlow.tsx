import React, { useMemo } from "react";
import {
  canCompleteAvatarProfile,
  evaluateBodyInput,
  evaluateFaceInput,
} from "@/src/features/wardrobe/avatar/avatarValidation";
import type { AvatarInputKind, AvatarInputQualityCheck } from "@/src/features/wardrobe/avatar/avatarTypes";
import { AvatarInputReview } from "./AvatarInputReview";

export type AvatarSetupStep = "face" | "body" | "review";

interface AvatarSetupFlowProps {
  step: AvatarSetupStep;
  facePreviewUrl?: string | null;
  bodyPreviewUrl?: string | null;
  faceQuality?: AvatarInputQualityCheck | null;
  bodyQuality?: AvatarInputQualityCheck | null;
  onSaveInput: (kind: AvatarInputKind, assetId: string, previewUrl: string, quality: AvatarInputQualityCheck) => void;
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Could not read avatar photo.")));
    reader.readAsDataURL(file);
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
  onSaveInput,
  onStepChange,
  onComplete,
}: AvatarSetupFlowProps) {
  const canFinish = useMemo(
    () => Boolean(faceQuality && bodyQuality && canCompleteAvatarProfile(faceQuality, bodyQuality)),
    [bodyQuality, faceQuality],
  );
  const activeKind: AvatarInputKind = step === "body" ? "body" : "face";
  const title = step === "review" ? "Review Your Avatar" : activeKind === "face" ? "Face Pic" : "Body Pic";

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = await readFileAsDataUrl(file);
    const quality = activeKind === "face" ? inferFaceQuality(file.name) : inferBodyQuality(file.name);
    onSaveInput(activeKind, `avatar-${activeKind}-${Date.now()}`, previewUrl, quality);

    if (quality.status !== "failed") {
      onStepChange?.(activeKind === "face" ? "body" : "review");
    }
  }

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
      <input type="file" accept="image/*" aria-label={`Upload ${title}`} onChange={handleFileChange} />
      {(activeKind === "face" ? faceQuality : bodyQuality)?.reasons.length ? (
        <p className="subtle" role="status" style={{ margin: 0 }}>
          {(activeKind === "face" ? faceQuality : bodyQuality)?.reasons.join(" ")}
        </p>
      ) : null}
    </section>
  );
}
