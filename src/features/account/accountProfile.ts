import type { GenderPresentation, OnboardingProfile, OnboardingProfileInput } from "./accountTypes";

const supportedGenderPresentations: GenderPresentation[] = ["men", "women", "unisex", "prefer_not_to_say"];

export type OnboardingProfileValidation =
  | { ok: true; value: OnboardingProfile }
  | { ok: false; error: string };

export function parseGenderPresentation(value: unknown): GenderPresentation | null {
  return typeof value === "string" && supportedGenderPresentations.includes(value as GenderPresentation)
    ? (value as GenderPresentation)
    : null;
}

export function validateOnboardingProfile(input: OnboardingProfileInput): OnboardingProfileValidation {
  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
  if (!displayName) {
    return { ok: false, error: "Enter your name to finish setup." };
  }

  const genderPresentation = parseGenderPresentation(input.genderPresentation);
  if (!genderPresentation) {
    return { ok: false, error: "Choose a valid style profile option." };
  }

  return { ok: true, value: { displayName, genderPresentation } };
}

export function createDefaultCircleName(displayName: string): string {
  const cleanName = displayName.trim();
  return cleanName ? `${cleanName}'s Circle` : "My Circle";
}
