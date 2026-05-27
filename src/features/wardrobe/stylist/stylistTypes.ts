import type { GarmentCategory, WardrobeProfileId } from "@/src/domain/wardrobe";
import type { OutfitSuggestion } from "@/src/features/wardrobe/outfits/outfitTypes";

export type StylistTiming = "now" | "tonight" | "tomorrow" | "custom";

export type StylistOccasion = "casual" | "office" | "dinner" | "dinner_date" | "smart_casual" | "travel_day";

export type StylistConstraint =
  | "closet_only"
  | "sharper"
  | "lots_of_walking"
  | "rain_ready"
  | "hot_humid"
  | "avoid_black_jeans";

export interface WeatherSummary {
  status: "unknown" | "ready" | "failed";
  locationLabel?: string;
  temperatureC?: number;
  humidityPercent?: number;
  rainChancePercent?: number;
  windKph?: number;
  conditionLabel: string;
  period: "now" | "tonight" | "tomorrow";
}

export interface StylistChip {
  id: string;
  label: string;
  kind: "timing" | "occasion" | "vibe" | "constraint" | "closet";
  selectedByDefault?: boolean;
  reason: string;
}

export interface StylistRequest {
  profileId: WardrobeProfileId;
  timing: StylistTiming;
  occasion: StylistOccasion;
  constraints: StylistConstraint[];
  note: string;
  includeIdeas: boolean;
  weather: WeatherSummary;
}

export interface MissingPieceIdea {
  id: string;
  label: string;
  category: GarmentCategory;
  why: string;
  pairsWithWardrobeItemIds: string[];
}

export interface StylistLook {
  id: string;
  variant: "best" | "sharper" | "wildcard";
  title: string;
  suggestion: OutfitSuggestion;
  weatherRationale: string;
  styleRationale: string;
  caveats: string[];
  missingPieceIdeas: MissingPieceIdea[];
}
