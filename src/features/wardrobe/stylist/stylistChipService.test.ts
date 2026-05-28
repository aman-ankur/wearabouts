import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { generateStylistChips } from "./stylistChipService";
import type { WeatherSummary } from "./stylistTypes";

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

const item = (input: Partial<WardrobeItem>): WardrobeItem => ({
  id: input.id ?? "item-1",
  sourceDetectedGarmentId: "garment-1",
  name: input.name ?? "Linen Shirt",
  brand: "",
  category: input.category ?? "tops",
  ownerProfileId: "profile-aankur",
  asset: { id: "asset-1", kind: "prettified", label: "Asset", visualToken: "shirt-striped" },
  addedAtIso: input.addedAtIso ?? "2026-05-28T10:00:00.000Z",
  readyForMixer: true,
  ...input,
});

describe("generateStylistChips", () => {
  it("shows dinner and closet-only defaults during evening", () => {
    const chips = generateStylistChips({
      now: new Date("2026-05-28T19:30:00+05:30"),
      weather: weather(),
      closetItems: [],
    });

    expect(chips.map((chip) => chip.label)).toContain("Tonight dinner");
    expect(chips).toContainEqual(expect.objectContaining({ id: "closet-only", selectedByDefault: true }));
  });

  it("shows tomorrow office for weekday context", () => {
    const chips = generateStylistChips({
      now: new Date("2026-05-28T20:00:00+05:30"),
      weather: weather(),
      closetItems: [],
    });

    expect(chips.map((chip) => chip.label)).toContain("Tomorrow office");
  });

  it("adds weather-specific chips only when relevant", () => {
    const chips = generateStylistChips({
      now: new Date("2026-05-28T12:00:00+05:30"),
      weather: weather({ rainChancePercent: 72, temperatureC: 31, humidityPercent: 84 }),
      closetItems: [],
    });

    expect(chips.map((chip) => chip.label)).toEqual(expect.arrayContaining(["Rain-ready", "Hot and humid"]));
  });

  it("suggests recently added closet items", () => {
    const chips = generateStylistChips({
      now: new Date("2026-05-28T12:00:00+05:30"),
      weather: weather(),
      closetItems: [item({ name: "New Linen Shirt", category: "tops", addedAtIso: "2026-05-28T08:00:00.000Z" })],
    });

    expect(chips.map((chip) => chip.label)).toContain("Use new top");
  });
});
