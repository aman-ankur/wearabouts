export type GenderPresentation = "men" | "women" | "unisex" | "prefer_not_to_say";

export interface OnboardingProfileInput {
  displayName: unknown;
  genderPresentation: unknown;
}

export interface OnboardingProfile {
  displayName: string;
  genderPresentation: GenderPresentation;
}

export interface CircleSummary {
  id: string;
  name: string;
}

export interface WardrobeProfileSummary {
  id: string;
  circleId: string;
  displayName: string;
  genderPresentation: GenderPresentation;
  profileType: "personal" | "shared";
}

export interface AccountStatus {
  email: string | null;
  onboardingComplete: boolean;
  circle: CircleSummary | null;
  profile: WardrobeProfileSummary | null;
}
