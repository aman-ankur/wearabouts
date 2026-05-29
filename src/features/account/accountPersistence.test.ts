import { describe, expect, it } from "vitest";
import { toAccountStatus } from "./accountPersistence";

describe("accountPersistence", () => {
  it("maps account rows into a completed account status", () => {
    expect(
      toAccountStatus(
        { id: "user-1", email: "aankur@example.com" },
        { id: "circle-1", name: "Aankur's Circle" },
        {
          id: "profile-1",
          circle_id: "circle-1",
          display_name: "Aankur",
          gender_presentation: "men",
          profile_type: "personal",
        },
      ),
    ).toEqual({
      email: "aankur@example.com",
      onboardingComplete: true,
      circle: { id: "circle-1", name: "Aankur's Circle" },
      profile: {
        id: "profile-1",
        circleId: "circle-1",
        displayName: "Aankur",
        genderPresentation: "men",
        profileType: "personal",
      },
    });
  });

  it("marks onboarding incomplete without a Circle and profile", () => {
    expect(toAccountStatus({ id: "user-1", email: null }, null, null)).toEqual({
      email: null,
      onboardingComplete: false,
      circle: null,
      profile: null,
    });
  });
});
