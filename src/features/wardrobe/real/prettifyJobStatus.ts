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

export function getTerminalPrettifyStatus(status: PrettifyJobStatus, accepted = true): PrettifyStatus {
  if (status === "failed") {
    return "failed";
  }

  if (status !== "ready") {
    return "processing";
  }

  return accepted ? "ready" : "needs_review";
}
