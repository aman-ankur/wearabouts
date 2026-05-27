import type { GarmentCategory, WardrobeItem } from "@/src/domain/wardrobe";
import type { MissingPieceIdea, StylistRequest } from "./stylistTypes";

function textFor(item: WardrobeItem): string {
  return [item.name, item.brand, item.material, item.formality, ...(item.styleTags ?? []), ...(item.occasionTags ?? []), ...(item.comfortTags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function readyItemsForProfile(request: StylistRequest, closetItems: WardrobeItem[]): WardrobeItem[] {
  return closetItems.filter(
    (item) => item.readyForMixer && (item.ownerProfileId === request.profileId || item.ownerProfileId === "profile-shared"),
  );
}

function hasRainReadyFootwear(items: WardrobeItem[]): boolean {
  return items.some((item) => item.category === "footwear" && (item.rainSuitability === "good" || /water|rain|technical/.test(textFor(item))));
}

function hasSmartLayer(items: WardrobeItem[]): boolean {
  return items.some(
    (item) =>
      item.category === "outerwear" &&
      (item.formality === "smart" || item.formality === "dressy" || /blazer|overshirt|jacket|shirt jacket/.test(textFor(item))),
  );
}

function hasBreathableSmartTop(items: WardrobeItem[]): boolean {
  return items.some(
    (item) =>
      item.category === "tops" &&
      (item.formality === "smart" || item.formality === "dressy") &&
      /linen|polo|knit|cotton|light/.test(textFor(item)),
  );
}

function hasWalkingFootwear(items: WardrobeItem[]): boolean {
  return items.some((item) => item.category === "footwear" && /sneaker|trainer|walking|comfort|soft|runner/.test(textFor(item)));
}

function pairIds(items: WardrobeItem[], categories: GarmentCategory[]): string[] {
  return items.filter((item) => categories.includes(item.category)).slice(0, 4).map((item) => item.id);
}

export function buildMissingPieceIdeas(request: StylistRequest, closetItems: WardrobeItem[]): MissingPieceIdea[] {
  if (!request.includeIdeas) {
    return [];
  }

  const items = readyItemsForProfile(request, closetItems);
  const ideas: MissingPieceIdea[] = [];
  const wantsRain = request.constraints.includes("rain_ready") || (request.weather.rainChancePercent ?? 0) >= 50;
  const wantsHotHumid =
    request.constraints.includes("hot_humid") || ((request.weather.temperatureC ?? 0) >= 28 && (request.weather.humidityPercent ?? 0) >= 70);
  const wantsDinner = request.occasion === "dinner" || request.occasion === "dinner_date";
  const wantsWalking = request.constraints.includes("lots_of_walking");

  if (wantsRain && !hasRainReadyFootwear(items)) {
    ideas.push({
      id: "waterproof-city-sneaker",
      label: "Sleek waterproof city sneaker",
      category: "footwear",
      why: "Handles rain risk without making the outfit feel like hiking gear.",
      pairsWithWardrobeItemIds: pairIds(items, ["tops", "bottoms", "outerwear"]),
    });
  }

  if (wantsDinner && !hasSmartLayer(items)) {
    ideas.push({
      id: "cropped-overshirt",
      label: "Cropped charcoal overshirt",
      category: "outerwear",
      why: "Sharpens dinner looks and still works for travel days.",
      pairsWithWardrobeItemIds: pairIds(items, ["tops", "bottoms", "footwear"]),
    });
  }

  if (wantsHotHumid && !hasBreathableSmartTop(items)) {
    ideas.push({
      id: "breathable-smart-top",
      label: "Lightweight linen shirt or knit polo",
      category: "tops",
      why: "Keeps warm-weather smart casual outfits polished without trapping heat.",
      pairsWithWardrobeItemIds: pairIds(items, ["bottoms", "footwear", "accessories"]),
    });
  }

  if (wantsWalking && !hasWalkingFootwear(items)) {
    ideas.push({
      id: "walking-city-sneaker",
      label: "Cushioned city walking sneaker",
      category: "footwear",
      why: "Makes long walking plans practical while staying clean enough for casual dinners.",
      pairsWithWardrobeItemIds: pairIds(items, ["tops", "bottoms"]),
    });
  }

  return ideas;
}
