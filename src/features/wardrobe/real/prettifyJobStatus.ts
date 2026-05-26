import type { PrettifyJobStatus, PrettifyStatus } from "@/src/domain/wardrobe";

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

export function getPrettifyJobSteps(status: PrettifyJobStatus): PrettifyJobStep[] {
  if (status === "failed") {
    return orderedSteps.map((step) => ({ ...step, state: step.id === "queued" ? "complete" : "failed" }));
  }

  const activeIndex = orderedSteps.findIndex((step) => step.id === status);

  return orderedSteps.map((step, index) => {
    if (index < activeIndex) {
      return { ...step, state: "complete" };
    }

    if (index === activeIndex) {
      return { ...step, state: "active" };
    }

    return { ...step, state: "pending" };
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
