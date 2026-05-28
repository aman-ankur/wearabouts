# Phase 7 Daily Stylist Design

## Summary

Phase 7 adds a new `Stylist` tab that answers the core everyday question:

> What should I wear now, tomorrow, or for this specific plan?

This is the next product-forward step after Phase 6 Smart Mixer. Mixer proved that Wearabouts can generate complete outfit suggestions from real closet items. Stylist turns that engine into a daily/event recommendation surface that uses time, location, weather, wardrobe state, and user intent.

The first implementation should replace the current `Trips` bottom-nav entry with `Stylist`. Multi-day trip planning stays parked for now and can later return as a mode inside Stylist.

Supporting mockup:

- `docs/product/mockups/2026-05-28-stylist-journey.html`

Parked trip concept:

- `docs/product/ideas/2026-05-28-china-trip-planner-idea.md`

Implementation handoff:

- `docs/product/plans/2026-05-28-phase-7-daily-stylist.md`

## Locked Product Decisions

- The tab is named `Stylist`.
- `Stylist` replaces `Trips` in the bottom nav for now.
- The primary prompt is `What are you dressing for?`
- The primary interaction is a fast control panel with contextual chips and an optional free-text note.
- Chips should feel intelligent and contextual, not like a static generic list.
- Weather should not be manually entered by the user.
- The app should use browser location permission when available.
- If location permission is denied or unavailable, ask for a city once.
- Use a free weather API such as Open-Meteo.
- The first result set is always closet-only.
- Outside-wardrobe ideas appear only after the user taps `Include ideas`.
- Outside-wardrobe ideas must be visually separate from owned closet items.
- The app must not pretend the user owns suggested missing pieces.
- Avatar preview is an explicit post-save action, not part of browsing recommendations.
- No avatar/body try-on is included in this phase.
- Do not add live trend scraping.

## Primary User Story

As a Wearabouts user with a real closet, I want to quickly ask what to wear now, tomorrow, or for a specific event, so I can get a stylish and practical outfit from my own wardrobe without filling out a long form.

## Success Moment

The first success moment is:

1. User opens `Stylist`.
2. Wearabouts knows the time and asks for location only if needed.
3. The app shows contextual chips such as `Tonight dinner`, `Tomorrow office`, `Smart casual`, `Hot and humid`, or `Rain-ready`.
4. User selects a few chips or writes a short note.
5. Wearabouts returns three closet-only looks:
   - `Best choice`
   - `Sharper option`
   - `Wildcard closet look`
6. User saves or refines one look.
7. Saved look offers an explicit `Render avatar preview` action for a later avatar phase.

The user should feel:

- The app understood the moment.
- The app did not waste time asking obvious weather questions.
- The recommendations came from real wardrobe items.
- The style quality is higher than a generic weather outfit.
- Outside-wardrobe suggestions are helpful but never pushy.

## Non-Goals

Phase 7 does not build:

- Multi-day trip planning.
- Real shopping links.
- Live trend scraping.
- Avatar creation.
- Avatar/body try-on.
- Photoreal outfit generation.
- Persistent wear memory.
- Calendar/email integrations.
- A fully open-ended autonomous stylist agent.
- Required AI for core outfit ranking.

## Experience Design

### Entry Point

Bottom nav should show:

```text
Home | Closet | Add | Mixer | Stylist
```

`Trips` should be removed from the primary nav. Existing trip code may stay in the codebase, but the visible product surface should lead users to Stylist.

### First Screen

The first screen uses the prompt:

```text
What are you dressing for?
```

The page should show:

- Current time/day.
- Location/weather state.
- Contextual chips.
- Optional free-text note.
- `Get outfits` action.

Location states:

- `unknown`: ask `Use my location` and `Enter city`.
- `locating`: show a compact loading state.
- `ready`: show city/area and weather summary.
- `denied`: show city input.
- `failed`: show city input and continue without blocking the whole page.

Weather should be helpful context, not a form:

- Temperature.
- Humidity when available.
- Rain chance.
- Wind only when meaningful.
- Forecast period for `now`, `tonight`, or `tomorrow`.

### Contextual Chips

Chips should be generated from deterministic context first:

- Current local time.
- Day of week.
- Weather summary.
- Selected profile.
- Closet contents.
- Recently added items.

Initial chip examples:

- `Wear now`
- `Tonight dinner`
- `Tomorrow office`
- `Dinner date`
- `Smart casual`
- `Sharper`
- `Lots of walking`
- `Rain-ready`
- `Hot and humid`
- `Use new shirt`
- `Closet only`

Chip rules:

- Always show `Wear now`.
- Show `Tonight dinner` on late afternoon/evening.
- Show `Tomorrow office` on weekday evenings and weekdays.
- Show `Rain-ready` only when rain chance is meaningful.
- Show `Hot and humid` when temperature/humidity makes fabric choice important.
- Show `Use new <category>` when the closet has recently added ready items.
- Keep `Closet only` selected by default.
- Do not show `Include ideas` as an always-on chip. It is a result-screen action.

The free-text note handles anything not covered by chips:

```text
tomorrow office, sharp but comfortable, no black jeans
```

### Result Set

The default result set is closet-only and returns three looks:

1. `Best choice`
   - Best practical style/weather/activity match.

2. `Sharper option`
   - More polished or fashion-forward while still using owned items.

3. `Wildcard closet look`
   - Higher style risk but still plausible and wearable.

Each look shows:

- Outfit board preview.
- Variant label.
- Confidence label.
- Owned item names.
- Weather/activity rationale.
- Style rationale.
- Warnings or caveats.
- `Pass`, `Save`, and `Refine` controls.

The result deck should stay compact on mobile:

- Weather is shown on the request screen, not repeated in a separate results summary box.
- The results header is an unboxed control row with the result-set mode, count, `Include ideas`, and `Edit request`.
- Do not show swipe instructions in the result deck.
- Tapping `Save` persists the current look and advances to the next suggestion.
- Tapping `Pass` advances to the next suggestion without saving.
- The result deck may support swipe gestures, but explicit controls must work end to end.

### Include Ideas

After closet-only results are visible, the user can tap:

```text
Include ideas
```

This adds missing-piece suggestions without replacing the closet-only looks.

Missing-piece ideas should answer:

- What item would improve the outfit?
- Why does it help?
- Which existing closet pieces does it unlock?
- Is it practical for the weather/activity?

Examples:

- `Cropped charcoal overshirt`: sharpens dinner looks and works for travel days.
- `Sleek waterproof city sneaker`: useful for rain, walking, and casual dinners.
- `Lightweight textured knit polo`: makes warm-weather smart casual looks feel current.

The UI must label these as not in closet.

### Refine

Refine should reuse the Phase 6 lock/swap model:

- User can lock slots.
- User can swap alternatives.
- User can ask for simple changes through chips or a short note.

Initial refine prompts:

- `More casual`
- `More formal`
- `Less black`
- `Better for walking`
- `Keep these pants`
- `Change shoes`

### Saved Look And Avatar Handoff

After saving a Stylist look, show a confirmation state:

- Saved look title.
- Outfit board.
- Owned item list.
- Recommendation source: `Stylist`.
- Closet-only or idea-assisted status.
- `Render avatar preview` call to action.

Avatar behavior in this phase:

- The button should be disabled with clear copy if avatar rendering is not implemented.
- It must not fake an avatar try-on.
- It should communicate that avatar render is a generated preview for a saved outfit.

## Technical Design

### Architecture

Add a focused Stylist layer above the existing outfit engine:

```text
src/features/wardrobe/stylist/
  stylistTypes.ts
  stylistContext.ts
  stylistChipService.ts
  stylistRequestParser.ts
  stylistRecommendationService.ts
  stylistMissingPieceService.ts
```

The Stylist UI should not build outfit combinations directly. It should:

1. Collect weather/time/location/request context.
2. Convert chips and note into a structured `StylistRequest`.
3. Call the existing outfit engine for closet-only suggestions.
4. Decorate the results with daily-stylist labels, rationales, caveats, and optional missing-piece ideas.

### Core Types

`StylistTiming`

```ts
export type StylistTiming = "now" | "tonight" | "tomorrow" | "custom";
```

`StylistOccasion`

```ts
export type StylistOccasion =
  | "casual"
  | "office"
  | "dinner"
  | "dinner_date"
  | "smart_casual"
  | "travel_day";
```

`StylistConstraint`

```ts
export type StylistConstraint =
  | "closet_only"
  | "sharper"
  | "lots_of_walking"
  | "rain_ready"
  | "hot_humid"
  | "avoid_black_jeans";
```

`WeatherSummary`

```ts
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
```

`StylistChip`

```ts
export interface StylistChip {
  id: string;
  label: string;
  kind: "timing" | "occasion" | "vibe" | "constraint" | "closet";
  selectedByDefault?: boolean;
  reason: string;
}
```

`StylistRequest`

```ts
export interface StylistRequest {
  profileId: WardrobeProfileId;
  timing: StylistTiming;
  occasion: StylistOccasion;
  constraints: StylistConstraint[];
  note: string;
  includeIdeas: boolean;
  weather: WeatherSummary;
}
```

`StylistLook`

```ts
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

`MissingPieceIdea`

```ts
export interface MissingPieceIdea {
  id: string;
  label: string;
  category: GarmentCategory;
  why: string;
  pairsWithWardrobeItemIds: string[];
}
```

### Weather Strategy

Use browser geolocation first. If unavailable, ask for city text.

For the first implementation:

- Geolocation lat/lon can call Open-Meteo directly.
- City lookup can use Open-Meteo geocoding.
- Weather forecast can use Open-Meteo forecast.
- Network failures should fall back to `WeatherSummary.status = "failed"` and still allow closet recommendations.

Recommended APIs:

```text
https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=en&format=json
https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=precipitation_probability,temperature_2m,relative_humidity_2m&forecast_days=2
```

Do not add API keys for weather.

### Intent Mapping

Map `StylistRequest` into the existing outfit engine:

- `office` -> `work`
- `dinner` -> `dinner`
- `dinner_date` -> `dinner`
- `smart_casual` -> `dinner` or `casual` depending on `sharper`
- `travel_day` -> `travel_day`
- `casual` -> `casual`
- `rain_ready` constraint -> prefer `rain_ready`
- `hot_humid` constraint -> prefer `warm_weather`

The service can call the outfit engine multiple times to produce variant diversity:

- Best: mapped primary intent.
- Sharper: dinner/work leaning.
- Wildcard: adjacent style intent with item diversity.

### Missing-Piece Ideas

Phase 7 should implement deterministic missing-piece ideas only after `includeIdeas` is true.

Rules:

- If no rain-capable shoes and rain chance is high, suggest waterproof city sneaker.
- If dinner/date and no smart layer exists, suggest cropped overshirt or lightweight blazer.
- If hot/humid and no breathable smart top exists, suggest linen shirt or knit polo.
- If lots of walking and footwear is missing or too dressy, suggest sleek walking sneaker.

AI-generated trend-aware suggestions can be a future enhancement after the deterministic version proves useful.

### UI Routing

Preferred route:

```text
app/stylist/page.tsx
```

Bottom nav:

- Replace `Trips` item with `Stylist`.
- Link to `/stylist`.

Existing `/trips`:

- It may stay available but should not appear in bottom nav.
- If simple, route `/trips` can show a message that trip planning will return inside Stylist later.

## Error And Empty States

No closet items:

- Show `Add clothes first`.
- Link to Upload.

Missing required outfit categories:

- Show which category is missing.
- Example: `Add at least one top and one bottom to get complete looks.`

Location denied:

- Ask for city.
- Allow `Skip weather` and continue with time-only chips.

Weather failed:

- Continue with time/day chips.
- Show `Weather unavailable, using wardrobe and occasion only.`

No compatible looks:

- Show a sparse-closet explanation.
- Offer `Open Mixer` and `Upload clothes`.

Include ideas with sparse closet:

- Suggest one or two missing categories that unlock recommendation quality.

## Testing Plan

Unit tests:

- Generates contextual chips for evening dinner.
- Generates `Tomorrow office` for weekday context.
- Adds `Rain-ready` only when rain chance is meaningful.
- Adds `Hot and humid` only when temperature/humidity warrant it.
- Parses selected chips into a `StylistRequest`.
- Maps stylist request to outfit intent.
- Returns three closet-only looks when enough wardrobe items exist.
- Returns missing-piece ideas only when `includeIdeas` is true.
- Does not include missing-piece ideas in default results.
- Handles failed weather context.

Component tests:

- Stylist page shows the primary prompt.
- Location unknown state shows location and city options.
- Weather-ready state shows contextual chips.
- Default results are labeled closet-only.
- `Include ideas` reveals separate missing-piece suggestions.
- Saved look confirmation includes avatar-render handoff copy without fake try-on.

Manual tests:

- Open `/stylist` with demo closet items.
- Use default chips and generate looks.
- Confirm three closet-only looks.
- Tap `Include ideas`.
- Confirm ideas are separated and labeled as not in closet.
- Save a look.
- Confirm saved look appears in Closet saved looks if wired to existing saved outfit state.
- Confirm bottom nav shows `Stylist`, not `Trips`.

Verification before completion:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Follow-Up Phases

### Phase 7B: AI Intent And Chip Polish

Use a low-latency, low-cost model to parse free-text notes and rank chip suggestions, while keeping deterministic fallbacks.

### Phase 7C: Persistent Feedback

Persist Stylist saves, rejects, refinements, and missing-piece interest as recommendation signals.

### Phase 7D: Avatar Preview For Saved Looks

Generate high-quality avatar previews only for selected saved looks.

### Phase 7E: Multi-Day Trip Planning Inside Stylist

Bring back trip planning as a Stylist mode:

```text
Plan several days
```

This can reuse the parked China trip planner idea and the daily stylist context model.
