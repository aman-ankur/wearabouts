import type { WardrobeProfileId } from "@/src/domain/wardrobe";
import type { StylistConstraint, StylistOccasion, StylistRequest, StylistTiming, WeatherSummary } from "./stylistTypes";

interface ParseStylistRequestInput {
  profileId: WardrobeProfileId;
  selectedChipIds: string[];
  note: string;
  includeIdeas?: boolean;
  weather: WeatherSummary;
}

function timingFrom(ids: Set<string>): StylistTiming {
  if (ids.has("tomorrow-office")) return "tomorrow";
  if (ids.has("tonight-dinner")) return "tonight";
  return "now";
}

function occasionFrom(ids: Set<string>): StylistOccasion {
  if (ids.has("tomorrow-office")) return "office";
  if (ids.has("dinner-date")) return "dinner_date";
  if (ids.has("tonight-dinner")) return "dinner";
  if (ids.has("smart-casual")) return "smart_casual";
  return "casual";
}

function constraintsFrom(ids: Set<string>): StylistConstraint[] {
  const constraints: StylistConstraint[] = ["closet_only"];
  if (ids.has("sharper")) constraints.push("sharper");
  if (ids.has("lots-of-walking")) constraints.push("lots_of_walking");
  if (ids.has("rain-ready")) constraints.push("rain_ready");
  if (ids.has("hot-humid")) constraints.push("hot_humid");
  if (ids.has("avoid-black-jeans")) constraints.push("avoid_black_jeans");
  return constraints;
}

export function parseStylistRequest(input: ParseStylistRequestInput): StylistRequest {
  const ids = new Set(input.selectedChipIds);

  return {
    profileId: input.profileId,
    timing: timingFrom(ids),
    occasion: occasionFrom(ids),
    constraints: constraintsFrom(ids),
    note: input.note.trim(),
    includeIdeas: input.includeIdeas ?? false,
    weather: input.weather,
  };
}
