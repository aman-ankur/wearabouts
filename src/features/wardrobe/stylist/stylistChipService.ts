import type { WardrobeItem } from "@/src/domain/wardrobe";
import type { StylistChip, WeatherSummary } from "./stylistTypes";

interface GenerateStylistChipsInput {
  now: Date;
  weather: WeatherSummary;
  closetItems: WardrobeItem[];
}

function uniqueChips(chips: StylistChip[]): StylistChip[] {
  const seen = new Set<string>();
  return chips.filter((chip) => {
    if (seen.has(chip.id)) {
      return false;
    }

    seen.add(chip.id);
    return true;
  });
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function recentlyAddedCategory(items: WardrobeItem[], now: Date): "top" | "bottom" | "shoes" | "layer" | null {
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const recent = items
    .filter((item) => item.readyForMixer && now.getTime() - Date.parse(item.addedAtIso) <= sevenDaysMs)
    .sort((first, second) => Date.parse(second.addedAtIso) - Date.parse(first.addedAtIso))[0];

  if (!recent) {
    return null;
  }

  if (recent.category === "tops") return "top";
  if (recent.category === "bottoms") return "bottom";
  if (recent.category === "footwear") return "shoes";
  if (recent.category === "outerwear") return "layer";
  return null;
}

export function generateStylistChips(input: GenerateStylistChipsInput): StylistChip[] {
  const hour = input.now.getHours();
  const chips: StylistChip[] = [
    {
      id: "wear-now",
      label: "Wear now",
      kind: "timing",
      selectedByDefault: true,
      reason: "Default immediate outfit request.",
    },
    {
      id: "closet-only",
      label: "Closet only",
      kind: "closet",
      selectedByDefault: true,
      reason: "Default results use owned wardrobe items.",
    },
  ];

  if (hour >= 16) {
    chips.push({ id: "tonight-dinner", label: "Tonight dinner", kind: "occasion", reason: "Evening context." });
  }

  if (isWeekday(input.now)) {
    chips.push({ id: "tomorrow-office", label: "Tomorrow office", kind: "occasion", reason: "Weekday planning context." });
  }

  chips.push(
    { id: "dinner-date", label: "Dinner date", kind: "occasion", reason: "Common going-out request." },
    { id: "smart-casual", label: "Smart casual", kind: "occasion", reason: "Common daily stylist request." },
    { id: "sharper", label: "Sharper", kind: "vibe", reason: "Raises polish and style confidence." },
    { id: "lots-of-walking", label: "Lots of walking", kind: "constraint", reason: "Prioritizes comfortable footwear." },
  );

  if ((input.weather.rainChancePercent ?? 0) >= 50) {
    chips.push({ id: "rain-ready", label: "Rain-ready", kind: "constraint", reason: "Forecast has meaningful rain risk." });
  }

  if ((input.weather.temperatureC ?? 0) >= 28 && (input.weather.humidityPercent ?? 0) >= 70) {
    chips.push({
      id: "hot-humid",
      label: "Hot and humid",
      kind: "constraint",
      reason: "Heat and humidity affect fabric and layering.",
    });
  }

  const category = recentlyAddedCategory(input.closetItems, input.now);
  if (category) {
    chips.push({
      id: `use-new-${category}`,
      label: `Use new ${category}`,
      kind: "closet",
      reason: "Recently added mixer-ready item.",
    });
  }

  return uniqueChips(chips);
}
