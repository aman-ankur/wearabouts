import { describe, expect, it } from "vitest";
import { createDefaultCircleName, parseGenderPresentation, validateOnboardingProfile } from "./accountProfile";

describe("accountProfile", () => {
  it("accepts a display name and gender presentation", () => {
    expect(validateOnboardingProfile({ displayName: " Aankur ", genderPresentation: "men" })).toEqual({
      ok: true,
      value: { displayName: "Aankur", genderPresentation: "men" },
    });
  });

  it("rejects an empty display name", () => {
    expect(validateOnboardingProfile({ displayName: " ", genderPresentation: "men" })).toEqual({
      ok: false,
      error: "Enter your name to finish setup.",
    });
  });

  it("rejects an unsupported gender presentation", () => {
    expect(validateOnboardingProfile({ displayName: "Aankur", genderPresentation: "unknown" })).toEqual({
      ok: false,
      error: "Choose a valid style profile option.",
    });
  });

  it("parses the supported gender presentation options", () => {
    expect(parseGenderPresentation("men")).toBe("men");
    expect(parseGenderPresentation("women")).toBe("women");
    expect(parseGenderPresentation("unisex")).toBe("unisex");
    expect(parseGenderPresentation("prefer_not_to_say")).toBe("prefer_not_to_say");
    expect(parseGenderPresentation("other")).toBeNull();
  });

  it("creates a friendly default Circle name", () => {
    expect(createDefaultCircleName("Aankur")).toBe("Aankur's Circle");
    expect(createDefaultCircleName(" ")).toBe("My Circle");
  });
});
