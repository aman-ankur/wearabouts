import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { buildMissingPieceIdeas } from "./stylistMissingPieceService";
import type { StylistRequest, WeatherSummary } from "./stylistTypes";

const addedAtIso = "2026-05-28T08:00:00.000Z";

const weather = (input: Partial<WeatherSummary> = {}): WeatherSummary => ({
  status: "ready",
  locationLabel: "Mumbai",
  temperatureC: 29,
  humidityPercent: 78,
  rainChancePercent: 10,
  conditionLabel: "Warm and humid",
  period: "now",
  ...input,
});

function request(input: Partial<StylistRequest> = {}): StylistRequest {
  return {
    profileId: "profile-aankur",
    timing: "now",
    occasion: "casual",
    constraints: ["closet_only"],
    note: "",
    includeIdeas: false,
    weather: weather(),
    ...input,
  };
}

function item(overrides: Partial<WardrobeItem> & Pick<WardrobeItem, "id" | "name" | "category">): WardrobeItem {
  return {
    sourceDetectedGarmentId: `detected-${overrides.id}`,
    brand: "",
    ownerProfileId: "profile-aankur",
    asset: { id: `asset-${overrides.id}`, kind: "prettified", label: overrides.name, visualToken: "shirt-striped" },
    addedAtIso,
    readyForMixer: true,
    ...overrides,
  };
}

const baseCloset: WardrobeItem[] = [
  item({ id: "tee", name: "White Tee", category: "tops", formality: "casual" }),
  item({ id: "trousers", name: "Charcoal Trousers", category: "bottoms", formality: "smart" }),
  item({ id: "loafers", name: "Brown Loafers", category: "footwear", formality: "smart" }),
];

describe("buildMissingPieceIdeas", () => {
  it("returns no ideas when includeIdeas is false", () => {
    const ideas = buildMissingPieceIdeas(request({ includeIdeas: false }), baseCloset);

    expect(ideas).toEqual([]);
  });

  it("suggests waterproof city sneaker for rain without rain-ready footwear", () => {
    const ideas = buildMissingPieceIdeas(
      request({ includeIdeas: true, constraints: ["closet_only", "rain_ready"], weather: weather({ rainChancePercent: 72 }) }),
      baseCloset,
    );

    expect(ideas).toContainEqual(expect.objectContaining({ id: "waterproof-city-sneaker", label: "Sleek waterproof city sneaker" }));
  });

  it("suggests a cropped overshirt for dinner/date without a smart layer", () => {
    const ideas = buildMissingPieceIdeas(request({ includeIdeas: true, occasion: "dinner_date" }), baseCloset);

    expect(ideas).toContainEqual(expect.objectContaining({ id: "cropped-overshirt", label: "Cropped charcoal overshirt" }));
  });

  it("suggests breathable smart top for hot humid requests without one", () => {
    const ideas = buildMissingPieceIdeas(
      request({ includeIdeas: true, constraints: ["closet_only", "hot_humid"], weather: weather({ temperatureC: 32, humidityPercent: 84 }) }),
      baseCloset,
    );

    expect(ideas).toContainEqual(expect.objectContaining({ id: "breathable-smart-top", label: "Lightweight linen shirt or knit polo" }));
  });
});
