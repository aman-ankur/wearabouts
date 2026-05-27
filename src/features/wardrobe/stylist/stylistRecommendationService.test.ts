import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { buildStylistLooks } from "./stylistRecommendationService";
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

const closetItems: WardrobeItem[] = [
  item({ id: "linen-shirt", name: "Linen Shirt", category: "tops", material: "linen", formality: "smart" }),
  item({ id: "graphic-tee", name: "Washed Graphic Tee", category: "tops", formality: "casual" }),
  item({ id: "charcoal-trousers", name: "Charcoal Travel Trousers", category: "bottoms", formality: "smart" }),
  item({ id: "jeans", name: "Dark Jeans", category: "bottoms", formality: "casual" }),
  item({ id: "loafers", name: "Brown Loafers", category: "footwear", formality: "smart" }),
  item({ id: "sneakers", name: "White Sneakers", category: "footwear", formality: "casual", comfortTags: ["walking"] }),
  item({ id: "jacket", name: "Brown Hooded Zip Jacket", category: "outerwear", formality: "casual" }),
];

describe("buildStylistLooks", () => {
  it("returns three closet-only stylist variants when enough wardrobe items exist", () => {
    const looks = buildStylistLooks(request(), closetItems);

    expect(looks).toHaveLength(3);
    expect(looks.map((look) => look.title)).toEqual(["Best choice", "Sharper option", "Wildcard closet look"]);
    expect(looks.every((look) => look.missingPieceIdeas.length === 0)).toBe(true);
  });

  it("maps office requests to work outfit intent", () => {
    const looks = buildStylistLooks(request({ occasion: "office", timing: "tomorrow" }), closetItems);

    expect(looks[0]?.suggestion.intent).toBe("work");
  });

  it("maps hot humid constraints to warm weather outfit intent", () => {
    const looks = buildStylistLooks(
      request({ constraints: ["closet_only", "hot_humid"], weather: weather({ temperatureC: 32, humidityPercent: 84 }) }),
      closetItems,
    );

    expect(looks[0]?.suggestion.intent).toBe("warm_weather");
  });

  it("maps rain-ready constraints to rain-ready outfit intent", () => {
    const looks = buildStylistLooks(
      request({ constraints: ["closet_only", "rain_ready"], weather: weather({ rainChancePercent: 72 }) }),
      closetItems,
    );

    expect(looks[0]?.suggestion.intent).toBe("rain_ready");
  });

  it("uses weather-unavailable rationale when weather has failed", () => {
    const looks = buildStylistLooks(request({ weather: weather({ status: "failed", conditionLabel: "Weather unavailable" }) }), closetItems);

    expect(looks[0]?.weatherRationale).toContain("weather is unavailable");
  });
});
