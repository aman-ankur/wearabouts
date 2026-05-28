# Phase 7 Daily Stylist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visible Trips tab with a weather-aware Daily Stylist that answers what to wear now, tomorrow, or for a specific occasion using closet-only outfit suggestions first.

**Architecture:** Build a focused `src/features/wardrobe/stylist/` layer above the existing Phase 6 outfit engine. The Stylist layer gathers time/weather/request context, generates contextual chips, maps user intent into outfit-engine intents, and decorates closet-only outfit suggestions with daily-stylist rationales. Missing-piece ideas are opt-in and deterministic in this slice.

**Tech Stack:** Next.js App Router, React, TypeScript, existing wardrobe context/reducers, existing outfit engine, Vitest, React Testing Library, Open-Meteo browser fetch for no-key weather.

---

## Required Reading

Before implementation, read:

- `AGENTS.md`
- `docs/product/PROJECT_CONTEXT.md`
- `docs/product/specs/2026-05-26-travogue-mvp-design.md`
- `docs/superpowers/specs/2026-05-27-phase6-smart-mixer-outfit-engine-design.md`
- `docs/product/plans/2026-05-27-phase-6-smart-mixer-outfit-engine.md`
- `docs/superpowers/specs/2026-05-28-phase7-daily-stylist-design.md`
- `docs/product/mockups/2026-05-28-stylist-journey.html`
- `docs/product/ideas/2026-05-28-china-trip-planner-idea.md`

## Locked Scope

Build:

- `/stylist` route.
- Bottom nav item `Stylist` replacing visible `Trips`.
- Automatic time/day context.
- Browser geolocation prompt path.
- City fallback path.
- Open-Meteo weather fetch with no API key.
- Contextual chip generation.
- Optional free-text note field.
- Three default closet-only looks.
- Opt-in `Include ideas` missing-piece suggestions.
- Save/refine handoff using existing saved outfit and outfit refinement patterns where practical.
- Avatar preview handoff copy only, with no fake try-on.

Do not build:

- Avatar rendering.
- Body try-on.
- Multi-day trip planner.
- Live trend scraping.
- Shopping links.
- Required AI calls.
- Supabase schema changes unless an existing persistence path already requires it.

## File Structure

Create:

```text
app/stylist/page.tsx
src/features/wardrobe/stylist/stylistTypes.ts
src/features/wardrobe/stylist/stylistChipService.ts
src/features/wardrobe/stylist/stylistChipService.test.ts
src/features/wardrobe/stylist/stylistRequestParser.ts
src/features/wardrobe/stylist/stylistRequestParser.test.ts
src/features/wardrobe/stylist/stylistRecommendationService.ts
src/features/wardrobe/stylist/stylistRecommendationService.test.ts
src/features/wardrobe/stylist/stylistMissingPieceService.ts
src/features/wardrobe/stylist/stylistMissingPieceService.test.ts
src/features/wardrobe/stylist/openMeteoWeather.ts
src/features/wardrobe/stylist/useStylistWeather.ts
src/features/wardrobe/components/StylistLookCard.tsx
src/features/wardrobe/components/StylistLookCard.test.tsx
```

Modify:

```text
src/features/wardrobe/components/BottomNav.tsx
src/features/wardrobe/outfits/outfitTypes.ts
src/features/wardrobe/outfits/outfitCompatibilityScorer.ts
src/features/wardrobe/outfits/outfitSuggestionProvider.ts
src/features/wardrobe/state/WardrobeContext.tsx
```

Optional:

```text
app/trips/page.tsx
```

Only modify `app/trips/page.tsx` if you want it to explain that trip planning will return inside Stylist later. Do not delete trip domain/selectors in this phase.

## Implementation Tasks

### Task 1: Add Stylist Domain Types

**Files:**

- Create: `src/features/wardrobe/stylist/stylistTypes.ts`

- [ ] **Step 1: Create the type module**

Add:

```ts
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
```

- [ ] **Step 2: Verify types**

Run:

```bash
npm run typecheck
```

Expected: exits successfully.

- [ ] **Step 3: Commit**

```bash
git add src/features/wardrobe/stylist/stylistTypes.ts
git commit -m "Add daily stylist domain types"
```

### Task 2: Generate Contextual Chips With TDD

**Files:**

- Create: `src/features/wardrobe/stylist/stylistChipService.test.ts`
- Create: `src/features/wardrobe/stylist/stylistChipService.ts`

- [ ] **Step 1: Write failing tests**

Add tests covering:

```ts
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
```

- [ ] **Step 2: Verify red**

Run:

```bash
npm run test -- src/features/wardrobe/stylist/stylistChipService.test.ts
```

Expected: fails because `stylistChipService.ts` does not exist.

- [ ] **Step 3: Implement chip generation**

Create `stylistChipService.ts` with deterministic rules:

```ts
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
    if (seen.has(chip.id)) return false;
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

  if (!recent) return null;
  if (recent.category === "tops") return "top";
  if (recent.category === "bottoms") return "bottom";
  if (recent.category === "footwear") return "shoes";
  if (recent.category === "outerwear") return "layer";
  return null;
}

export function generateStylistChips(input: GenerateStylistChipsInput): StylistChip[] {
  const hour = input.now.getHours();
  const chips: StylistChip[] = [
    { id: "wear-now", label: "Wear now", kind: "timing", selectedByDefault: true, reason: "Default immediate outfit request." },
    { id: "closet-only", label: "Closet only", kind: "closet", selectedByDefault: true, reason: "Default results use owned wardrobe items." },
  ];

  if (hour >= 16) {
    chips.push({ id: "tonight-dinner", label: "Tonight dinner", kind: "occasion", reason: "Evening context." });
  }

  if (isWeekday(input.now)) {
    chips.push({ id: "tomorrow-office", label: "Tomorrow office", kind: "occasion", reason: "Weekday planning context." });
  }

  chips.push(
    { id: "smart-casual", label: "Smart casual", kind: "occasion", reason: "Common daily stylist request." },
    { id: "sharper", label: "Sharper", kind: "vibe", reason: "Raises polish and style confidence." },
    { id: "lots-of-walking", label: "Lots of walking", kind: "constraint", reason: "Prioritizes comfortable footwear." },
  );

  if ((input.weather.rainChancePercent ?? 0) >= 50) {
    chips.push({ id: "rain-ready", label: "Rain-ready", kind: "constraint", reason: "Forecast has meaningful rain risk." });
  }

  if ((input.weather.temperatureC ?? 0) >= 28 && (input.weather.humidityPercent ?? 0) >= 70) {
    chips.push({ id: "hot-humid", label: "Hot and humid", kind: "constraint", reason: "Heat and humidity affect fabric and layering." });
  }

  const category = recentlyAddedCategory(input.closetItems, input.now);
  if (category) {
    chips.push({ id: `use-new-${category}`, label: `Use new ${category}`, kind: "closet", reason: "Recently added mixer-ready item." });
  }

  return uniqueChips(chips);
}
```

- [ ] **Step 4: Verify green**

Run:

```bash
npm run test -- src/features/wardrobe/stylist/stylistChipService.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/wardrobe/stylist/stylistChipService.ts src/features/wardrobe/stylist/stylistChipService.test.ts
git commit -m "Add contextual stylist chips"
```

### Task 3: Parse Chips Into A Stylist Request

**Files:**

- Create: `src/features/wardrobe/stylist/stylistRequestParser.test.ts`
- Create: `src/features/wardrobe/stylist/stylistRequestParser.ts`

- [ ] **Step 1: Write failing tests**

Test that selected chip IDs produce:

- `timing: "tomorrow"` and `occasion: "office"` for `tomorrow-office`.
- `occasion: "dinner"` for `tonight-dinner`.
- `constraints` including `sharper`, `lots_of_walking`, `rain_ready`, `hot_humid`.
- `includeIdeas` remains caller-controlled and defaults false.

- [ ] **Step 2: Verify red**

Run:

```bash
npm run test -- src/features/wardrobe/stylist/stylistRequestParser.test.ts
```

Expected: fails because parser does not exist.

- [ ] **Step 3: Implement parser**

Implement deterministic mapping:

```ts
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
```

- [ ] **Step 4: Verify green**

Run:

```bash
npm run test -- src/features/wardrobe/stylist/stylistRequestParser.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/wardrobe/stylist/stylistRequestParser.ts src/features/wardrobe/stylist/stylistRequestParser.test.ts
git commit -m "Parse stylist chip requests"
```

### Task 4: Add Weather Fetching

**Files:**

- Create: `src/features/wardrobe/stylist/openMeteoWeather.ts`
- Create: `src/features/wardrobe/stylist/useStylistWeather.ts`

- [ ] **Step 1: Add Open-Meteo helpers**

Implement:

```ts
import type { WeatherSummary } from "./stylistTypes";

interface Coordinates {
  latitude: number;
  longitude: number;
  label?: string;
}

interface GeocodingResult {
  results?: Array<{ name: string; country?: string; latitude: number; longitude: number }>;
}

interface ForecastResult {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
  };
}

export async function geocodeCity(city: string): Promise<Coordinates | null> {
  const params = new URLSearchParams({ name: city, count: "1", language: "en", format: "json" });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) return null;
  const payload = (await response.json()) as GeocodingResult;
  const first = payload.results?.[0];
  return first ? { latitude: first.latitude, longitude: first.longitude, label: [first.name, first.country].filter(Boolean).join(", ") } : null;
}

export async function fetchWeatherSummary(coordinates: Coordinates, period: WeatherSummary["period"]): Promise<WeatherSummary> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
    hourly: "precipitation_probability,temperature_2m,relative_humidity_2m",
    forecast_days: "2",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    return { status: "failed", locationLabel: coordinates.label, conditionLabel: "Weather unavailable", period };
  }

  const payload = (await response.json()) as ForecastResult;
  const rainChancePercent = Math.max(...(payload.hourly?.precipitation_probability ?? [0]).slice(0, period === "tomorrow" ? 36 : 12));
  const temperatureC = Math.round(payload.current?.temperature_2m ?? payload.hourly?.temperature_2m?.[0] ?? 0);
  const humidityPercent = Math.round(payload.current?.relative_humidity_2m ?? payload.hourly?.relative_humidity_2m?.[0] ?? 0);
  const conditionLabel = rainChancePercent >= 50 ? "Rain possible" : temperatureC >= 28 && humidityPercent >= 70 ? "Warm and humid" : "Mild";

  return {
    status: "ready",
    locationLabel: coordinates.label,
    temperatureC,
    humidityPercent,
    rainChancePercent,
    windKph: Math.round(payload.current?.wind_speed_10m ?? 0),
    conditionLabel,
    period,
  };
}
```

- [ ] **Step 2: Add client hook**

Implement `useStylistWeather` as a client hook with:

- `weather`
- `locationState: "unknown" | "locating" | "ready" | "denied" | "failed"`
- `requestBrowserLocation()`
- `lookupCity(city: string)`
- `skipWeather()`

Use `navigator.geolocation.getCurrentPosition` in `requestBrowserLocation`.

- [ ] **Step 3: Verify**

Run:

```bash
npm run typecheck
```

Expected: exits successfully.

- [ ] **Step 4: Commit**

```bash
git add src/features/wardrobe/stylist/openMeteoWeather.ts src/features/wardrobe/stylist/useStylistWeather.ts
git commit -m "Add stylist weather context"
```

### Task 5: Build Stylist Recommendation Service

**Files:**

- Create: `src/features/wardrobe/stylist/stylistRecommendationService.test.ts`
- Create: `src/features/wardrobe/stylist/stylistRecommendationService.ts`
- Modify: `src/features/wardrobe/outfits/outfitTypes.ts`
- Modify: `src/features/wardrobe/outfits/outfitCompatibilityScorer.ts`
- Modify: `src/features/wardrobe/outfits/outfitSuggestionProvider.ts`

- [ ] **Step 1: Extend outfit intents if needed**

If the current `OutfitIntent` already includes `casual`, `dinner`, `travel_day`, `work`, `warm_weather`, and `rain_ready`, do not add more intents yet. Keep the intent set small for Phase 7.

- [ ] **Step 2: Write failing tests**

Test:

- Enough closet items returns three looks.
- Default looks have no missing-piece ideas.
- `office` maps to `work`.
- `hot_humid` maps to `warm_weather`.
- `rain_ready` constraint maps to `rain_ready`.

- [ ] **Step 3: Implement recommendation service**

Implement:

```ts
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { buildOutfitSuggestions } from "@/src/features/wardrobe/outfits/outfitSuggestionProvider";
import type { OutfitIntent } from "@/src/features/wardrobe/outfits/outfitTypes";
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

export function buildStylistLooks(request: StylistRequest, closetItems: WardrobeItem[]): StylistLook[] {
  const variants: StylistLook["variant"][] = ["best", "sharper", "wildcard"];
  const usedSuggestionIds = new Set<string>();

  return variants.flatMap((variant) => {
    const suggestions = buildOutfitSuggestions({
      profileId: request.profileId,
      intent: intentFor(request, variant),
      closetItems,
      savedOutfits: [],
      feedbackSignals: [],
      maxSuggestions: 5,
    });
    const suggestion = suggestions.find((item) => !usedSuggestionIds.has(item.id)) ?? suggestions[0];
    if (!suggestion) return [];
    usedSuggestionIds.add(suggestion.id);

    return [{
      id: `stylist-${variant}-${suggestion.id}`,
      variant,
      title: variantTitle(variant),
      suggestion,
      weatherRationale: request.weather.status === "ready"
        ? `Built for ${request.weather.conditionLabel.toLowerCase()} around ${request.weather.locationLabel ?? "your location"}.`
        : "Built from wardrobe and occasion because weather is unavailable.",
      styleRationale: variant === "sharper"
        ? "Leans more polished while staying within your closet."
        : variant === "wildcard"
          ? "A slightly less obvious closet combination that still fits the request."
          : "Balances practicality, comfort, and style for the moment.",
      caveats: suggestion.warnings,
      missingPieceIdeas: [],
    }];
  }).slice(0, 3);
}
```

- [ ] **Step 4: Verify green**

Run:

```bash
npm run test -- src/features/wardrobe/stylist/stylistRecommendationService.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/wardrobe/stylist/stylistRecommendationService.ts src/features/wardrobe/stylist/stylistRecommendationService.test.ts src/features/wardrobe/outfits/outfitTypes.ts src/features/wardrobe/outfits/outfitCompatibilityScorer.ts src/features/wardrobe/outfits/outfitSuggestionProvider.ts
git commit -m "Build daily stylist recommendations"
```

### Task 6: Add Opt-In Missing-Piece Ideas

**Files:**

- Create: `src/features/wardrobe/stylist/stylistMissingPieceService.test.ts`
- Create: `src/features/wardrobe/stylist/stylistMissingPieceService.ts`
- Modify: `src/features/wardrobe/stylist/stylistRecommendationService.ts`

- [ ] **Step 1: Write failing tests**

Test:

- No ideas when `includeIdeas` is false.
- Rain request without rain-ready footwear suggests waterproof city sneaker.
- Dinner/date without a smart layer suggests cropped overshirt.
- Hot/humid request without breathable smart top suggests linen shirt or knit polo.

- [ ] **Step 2: Implement deterministic missing-piece service**

Implement rules from the design spec. Each idea must include:

- `id`
- `label`
- `category`
- `why`
- `pairsWithWardrobeItemIds`

- [ ] **Step 3: Wire into recommendation service**

Only attach ideas when `request.includeIdeas === true`.

- [ ] **Step 4: Verify green**

Run:

```bash
npm run test -- src/features/wardrobe/stylist/stylistMissingPieceService.test.ts src/features/wardrobe/stylist/stylistRecommendationService.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/wardrobe/stylist/stylistMissingPieceService.ts src/features/wardrobe/stylist/stylistMissingPieceService.test.ts src/features/wardrobe/stylist/stylistRecommendationService.ts src/features/wardrobe/stylist/stylistRecommendationService.test.ts
git commit -m "Add opt-in stylist missing piece ideas"
```

### Task 7: Build Stylist Look Card

**Files:**

- Create: `src/features/wardrobe/components/StylistLookCard.tsx`
- Create: `src/features/wardrobe/components/StylistLookCard.test.tsx`

- [ ] **Step 1: Write component tests**

Test:

- Renders `Best choice`.
- Shows closet-only copy when no ideas exist.
- Shows missing-piece idea labels only when ideas are present.
- Shows `Save` and `Refine` actions.

- [ ] **Step 2: Implement component**

Use existing visual patterns from Mixer:

- Outfit board preview should use existing board/stage components when practical.
- Do not introduce avatar/body try-on.
- Missing-piece ideas should render in a separate section labeled `Not in your closet`.

- [ ] **Step 3: Verify**

Run:

```bash
npm run test -- src/features/wardrobe/components/StylistLookCard.test.tsx
npm run typecheck
```

Expected: tests and typecheck pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/wardrobe/components/StylistLookCard.tsx src/features/wardrobe/components/StylistLookCard.test.tsx
git commit -m "Add stylist look card"
```

### Task 8: Build `/stylist` Route

**Files:**

- Create: `app/stylist/page.tsx`
- Modify: `src/features/wardrobe/state/WardrobeContext.tsx`

- [ ] **Step 1: Add route state**

The page should manage:

- selected chip IDs
- optional note
- include ideas boolean
- generated looks
- saved confirmation
- city input

Use:

- `useStylistWeather`
- `generateStylistChips`
- `parseStylistRequest`
- `buildStylistLooks`
- `StylistLookCard`
- existing `saveCurrentOutfit`

- [ ] **Step 2: Build empty and weather states**

States:

- No mixer-ready closet items: link to `/upload`.
- Location unknown: show `Use my location`, `Enter city`, and `Skip weather`.
- Weather ready: show weather strip and contextual chips.
- Weather failed/skipped: show time/day chips and continue.

- [ ] **Step 3: Build result flow**

When the user clicks `Get outfits`:

- Build a `StylistRequest`.
- Generate three closet-only looks.
- Show `Include ideas` button.
- If `Include ideas` is clicked, regenerate with `includeIdeas: true`.
- Saving a look calls `saveCurrentOutfit` with metadata:

```ts
{
  source: "suggestion",
  intent: "stylist",
  rationale: `${look.weatherRationale} ${look.styleRationale}`,
}
```

- [ ] **Step 4: Add avatar handoff copy**

After save, show:

```text
Preview this on me
Generate one high-quality avatar render for this saved outfit.
```

The button can be disabled or non-functional in this phase. It must not fake a render.

- [ ] **Step 5: Verify**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add app/stylist/page.tsx src/features/wardrobe/state/WardrobeContext.tsx
git commit -m "Build daily stylist route"
```

### Task 9: Replace Trips In Bottom Nav

**Files:**

- Modify: `src/features/wardrobe/components/BottomNav.tsx`
- Optional modify: `app/trips/page.tsx`

- [ ] **Step 1: Update nav item**

Change visible bottom nav label/link from:

```text
Trips -> /trips
```

to:

```text
Stylist -> /stylist
```

- [ ] **Step 2: Keep trip code parked**

Do not delete trip selectors, reducer, fixtures, or page unless explicitly requested. If editing `/trips`, replace the page body with a small parked message and link to `/stylist`.

- [ ] **Step 3: Verify**

Run:

```bash
npm run test
npm run typecheck
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/wardrobe/components/BottomNav.tsx app/trips/page.tsx
git commit -m "Replace trips nav with stylist"
```

If `app/trips/page.tsx` was not modified, omit it from `git add`.

### Task 10: Browser Verification

**Files:**

- Modify: `docs/testing/WEARABOUTS_UX_TEST_LOG.md` if the file exists.
- Add screenshots under `testing/screenshots/` only if screenshot workflow is already in use.

- [ ] **Step 1: Start dev server on port 3000 only**

Follow `AGENTS.md`:

```bash
npm run dev -- -p 3000
```

If port 3000 is occupied, identify and kill the process using port 3000, then start again on port 3000. Do not allow fallback to port 3001.

- [ ] **Step 2: Manual path**

Verify:

1. Open `/stylist`.
2. Confirm bottom nav shows `Stylist`.
3. Confirm weather/location state appears.
4. Skip weather or enter a city if browser location is not convenient.
5. Confirm contextual chips render.
6. Click `Get outfits`.
7. Confirm three closet-only looks.
8. Click `Include ideas`.
9. Confirm missing-piece ideas appear separately and are labeled as not in closet.
10. Save a look.
11. Confirm saved state shows avatar handoff copy.

- [ ] **Step 3: Full checks**

Run:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 4: Commit verification docs if changed**

```bash
git add docs/testing/WEARABOUTS_UX_TEST_LOG.md testing/screenshots
git commit -m "Document daily stylist verification"
```

Only run this commit if testing docs/screenshots changed.

## Final PR Checklist

Before opening a PR:

- [ ] Confirm repo-local git identity:

```bash
git config user.name
git config user.email
```

Expected:

```text
aman-ankur
amanankur1110@gmail.com
```

- [ ] Confirm all checks pass:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

- [ ] Confirm no avatar/body try-on was added.
- [ ] Confirm default results are closet-only.
- [ ] Confirm missing-piece ideas require `Include ideas`.
- [ ] Confirm `Stylist` replaced visible `Trips` nav.
- [ ] Push a `codex/` branch and create a PR.
