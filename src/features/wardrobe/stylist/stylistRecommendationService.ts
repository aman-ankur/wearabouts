import type { WardrobeItem } from "@/src/domain/wardrobe";
import { buildOutfitSuggestions } from "@/src/features/wardrobe/outfits/outfitSuggestionProvider";
import type { OutfitIntent } from "@/src/features/wardrobe/outfits/outfitTypes";
import { buildMissingPieceIdeas } from "./stylistMissingPieceService";
import type { StylistLook, StylistRequest } from "./stylistTypes";

function intentFor(request: StylistRequest, variant: StylistLook["variant"]): OutfitIntent {
  if (request.constraints.includes("rain_ready")) return "rain_ready";
  if (request.constraints.includes("hot_humid")) return "warm_weather";
  if (request.occasion === "office") return "work";
  if (request.occasion === "dinner" || request.occasion === "dinner_date") return "dinner";
  if (request.occasion === "travel_day") return "travel_day";
  if (variant === "sharper" || request.constraints.includes("sharper")) return "dinner";
  return "casual";
}

function variantTitle(variant: StylistLook["variant"]): string {
  if (variant === "best") return "Best choice";
  if (variant === "sharper") return "Sharper option";
  return "Wildcard closet look";
}

function styleRationale(variant: StylistLook["variant"]): string {
  if (variant === "sharper") {
    return "Leans more polished while staying within your closet.";
  }

  if (variant === "wildcard") {
    return "A slightly less obvious closet combination that still fits the request.";
  }

  return "Balances practicality, comfort, and style for the moment.";
}

export function buildStylistLooks(request: StylistRequest, closetItems: WardrobeItem[]): StylistLook[] {
  const variants: StylistLook["variant"][] = ["best", "sharper", "wildcard"];
  const usedSuggestionIds = new Set<string>();
  const missingPieceIdeas = request.includeIdeas ? buildMissingPieceIdeas(request, closetItems) : [];

  return variants
    .flatMap((variant) => {
      const suggestions = buildOutfitSuggestions({
        profileId: request.profileId,
        intent: intentFor(request, variant),
        closetItems,
        savedOutfits: [],
        feedbackSignals: [],
        maxSuggestions: 5,
      });
      const suggestion = suggestions.find((item) => !usedSuggestionIds.has(item.id)) ?? suggestions[0];
      if (!suggestion) {
        return [];
      }

      usedSuggestionIds.add(suggestion.id);

      return [
        {
          id: `stylist-${variant}-${suggestion.id}`,
          variant,
          title: variantTitle(variant),
          suggestion,
          weatherRationale:
            request.weather.status === "ready"
              ? `Built for ${request.weather.conditionLabel.toLowerCase()} around ${request.weather.locationLabel ?? "your location"}.`
              : "Built from wardrobe and occasion because weather is unavailable.",
          styleRationale: styleRationale(variant),
          caveats: suggestion.warnings,
          missingPieceIdeas,
        },
      ];
    })
    .slice(0, 3);
}
