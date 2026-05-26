import type { PrettifyJobStatus, PrettifyStatus } from "@/src/domain/wardrobe";
import type { PrettifyJobKind } from "./realWardrobePipeline";

export type PrettifyStepState = "complete" | "active" | "pending" | "failed";

export interface PrettifyJobStep {
  id: Exclude<PrettifyJobStatus, "failed">;
  label: string;
  state: PrettifyStepState;
}

const orderedSteps: Array<{ id: Exclude<PrettifyJobStatus, "failed">; label: string }> = [
  { id: "queued", label: "Upload" },
  { id: "analyzing", label: "Analyze" },
  { id: "prettifying", label: "Prettify" },
  { id: "validating", label: "Validate" },
  { id: "ready", label: "Review" },
];

const outfitStepLabels: Partial<Record<Exclude<PrettifyJobStatus, "failed">, string>> = {
  analyzing: "Detect garments",
  prettifying: "Prettify garments",
  validating: "Validate assets",
};

function getStepLabel(step: (typeof orderedSteps)[number], jobKind?: PrettifyJobKind): string {
  if (jobKind === "outfit_parent") {
    return outfitStepLabels[step.id] ?? step.label;
  }

  return step.label;
}

export function getPrettifyJobSteps(status: PrettifyJobStatus, jobKind?: PrettifyJobKind): PrettifyJobStep[] {
  if (status === "failed") {
    return orderedSteps.map((step) => ({
      ...step,
      label: getStepLabel(step, jobKind),
      state: step.id === "queued" ? "complete" : "failed",
    }));
  }

  const activeIndex = orderedSteps.findIndex((step) => step.id === status);

  return orderedSteps.map((step, index) => {
    if (index < activeIndex) {
      return { ...step, label: getStepLabel(step, jobKind), state: "complete" };
    }

    if (index === activeIndex) {
      return { ...step, label: getStepLabel(step, jobKind), state: "active" };
    }

    return { ...step, label: getStepLabel(step, jobKind), state: "pending" };
  });
}

export function getPrettifyStepCaption(
  stepId: Exclude<PrettifyJobStatus, "failed">,
  state: PrettifyStepState,
  jobKind?: PrettifyJobKind,
): string {
  if (state === "complete") {
    const completeCaptions: Record<Exclude<PrettifyJobStatus, "failed">, string> = {
      queued: "Uploaded",
      analyzing: jobKind === "outfit_parent" ? "Pieces found" : "Analyzed",
      prettifying: jobKind === "outfit_parent" ? "Garments cleaned" : "Asset cleaned",
      validating: "Validated",
      ready: "Ready for review",
    };

    return completeCaptions[stepId];
  }

  if (state === "active") {
    const activeCaptions: Record<Exclude<PrettifyJobStatus, "failed">, string> = {
      queued: "Receiving upload",
      analyzing: jobKind === "outfit_parent" ? "Finding visible pieces" : "Reading garment details",
      prettifying: jobKind === "outfit_parent" ? "Cleaning wardrobe items" : "Cleaning wardrobe item",
      validating: "Checking the result",
      ready: "Ready for review",
    };

    return activeCaptions[stepId];
  }

  if (state === "failed") {
    return "Needs another try";
  }

  const pendingCaptions: Record<Exclude<PrettifyJobStatus, "failed">, string> = {
    queued: "Upload waiting",
    analyzing: jobKind === "outfit_parent" ? "Detection waiting" : "Analysis waiting",
    prettifying: jobKind === "outfit_parent" ? "Prettify waiting" : "Cleanup waiting",
    validating: "Validation waiting",
    ready: "Review waiting",
  };

  return pendingCaptions[stepId];
}

export function getTerminalPrettifyStatus(status: PrettifyJobStatus, accepted = true): PrettifyStatus {
  if (status === "failed") {
    return "failed";
  }

  if (status !== "ready") {
    return "processing";
  }

  return accepted ? "ready" : "needs_review";
}
