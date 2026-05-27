import { describe, expect, it } from "vitest";
import { parseStylistRequest } from "./stylistRequestParser";
import type { WeatherSummary } from "./stylistTypes";

const weather: WeatherSummary = {
  status: "ready",
  locationLabel: "Mumbai",
  temperatureC: 29,
  humidityPercent: 78,
  rainChancePercent: 10,
  conditionLabel: "Warm and humid",
  period: "now",
};

describe("parseStylistRequest", () => {
  it("maps tomorrow office chips into tomorrow office request", () => {
    const request = parseStylistRequest({
      profileId: "profile-aankur",
      selectedChipIds: ["tomorrow-office", "closet-only"],
      note: " sharp but comfortable ",
      weather,
    });

    expect(request).toMatchObject({
      profileId: "profile-aankur",
      timing: "tomorrow",
      occasion: "office",
      note: "sharp but comfortable",
      includeIdeas: false,
    });
    expect(request.constraints).toContain("closet_only");
  });

  it("maps tonight dinner into dinner occasion", () => {
    const request = parseStylistRequest({
      profileId: "profile-aankur",
      selectedChipIds: ["tonight-dinner"],
      note: "",
      weather,
    });

    expect(request.timing).toBe("tonight");
    expect(request.occasion).toBe("dinner");
  });

  it("maps selected constraint chips", () => {
    const request = parseStylistRequest({
      profileId: "profile-aankur",
      selectedChipIds: ["sharper", "lots-of-walking", "rain-ready", "hot-humid", "avoid-black-jeans"],
      note: "",
      weather,
    });

    expect(request.constraints).toEqual([
      "closet_only",
      "sharper",
      "lots_of_walking",
      "rain_ready",
      "hot_humid",
      "avoid_black_jeans",
    ]);
  });

  it("keeps include ideas caller-controlled", () => {
    const request = parseStylistRequest({
      profileId: "profile-aankur",
      selectedChipIds: ["smart-casual"],
      note: "",
      includeIdeas: true,
      weather,
    });

    expect(request.occasion).toBe("smart_casual");
    expect(request.includeIdeas).toBe(true);
  });
});
