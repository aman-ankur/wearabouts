import type { GarmentCandidateChoice } from "@/src/domain/wardrobe";

interface CandidatePickerInput {
  isPersistentMode: boolean;
  isOutfitBatch: boolean;
  garmentCount: number;
  candidates: GarmentCandidateChoice[];
}

function isPendingCandidate(candidate: GarmentCandidateChoice): boolean {
  return candidate.status !== "ready";
}

function isSelectableCandidate(candidate: GarmentCandidateChoice): boolean {
  return candidate.selectionStatus !== "not_recommended" && candidate.selectionStatus !== "skipped_existing";
}

export function shouldShowReviewCandidatePicker(input: CandidatePickerInput): boolean {
  return (
    input.isPersistentMode &&
    input.isOutfitBatch &&
    input.garmentCount === 0 &&
    input.candidates.some(isPendingCandidate)
  );
}

export function getDefaultSelectedReviewCandidateIds(candidates: GarmentCandidateChoice[]): string[] {
  const pendingCandidates = candidates.filter(isPendingCandidate);
  const primaryIds = pendingCandidates
    .filter((candidate) => candidate.selectionStatus === "primary" || candidate.selectionStatus === "selected")
    .map((candidate) => candidate.id);
  if (primaryIds.length > 0) {
    return primaryIds;
  }

  return pendingCandidates.filter(isSelectableCandidate).map((candidate) => candidate.id);
}

export function getReviewCandidateStatusMessage(candidate: GarmentCandidateChoice): string {
  if (candidate.status === "failed" && isProviderSafetyError(candidate.errorMessage)) {
    return "Wearabouts could not generate this item because the image provider blocked it with a safety filter.";
  }

  if (candidate.status === "failed") {
    return "Wearabouts could not generate this item. Try a clearer photo or a different crop.";
  }

  return candidate.selectionReason;
}

function isProviderSafetyError(message?: string | null): boolean {
  const normalized = message?.toLowerCase() ?? "";
  return normalized.includes("safety") || normalized.includes("safety_violations");
}
