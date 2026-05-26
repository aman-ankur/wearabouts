# Wearabouts Phase 3 Trip Looks Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the demo Trip Looks flow: create a client-side demo trip, generate day-by-day outfit looks from closet/mixer selections, approve or swap looks, and show a derived packing list.

**Architecture:** Extend the existing demo-only wardrobe context with trip domain types, pure trip selectors, a trip reducer slice, fixture trip data, and mobile-first UI pages/components. Keep this phase client-side and fixture-driven; do not add real AI, Supabase, auth, real upload, weather APIs, or avatar rendering.

**Tech Stack:** Next.js App Router, React, TypeScript, existing CSS globals, Vitest for reducer/selector tests, lucide-react icons.

---

## Scope

Build:

- Trip domain types for trip profile, trip days, trip looks, and packing items.
- Demo trip fixtures for a three-day Goa trip.
- Trip selectors for generating trip looks from closet items and saved outfits.
- Trip reducer actions for creating a demo trip, approving looks, and swapping a day look.
- `/trips` route with setup/demo-start screen, day-by-day looks, and packing list.
- Bottom nav entry for Trips.
- Testing documentation and screenshots for the Phase 3 flow.

Do not build:

- Real AI recommendations.
- Weather APIs.
- Supabase persistence.
- Auth or household collaboration.
- Calendar/email itinerary import.
- Real avatar render or try-on.
- Drag-and-drop trip planning.

## File Structure

Create:

```text
app/trips/page.tsx
src/features/wardrobe/fixtures/demoTrip.ts
src/features/wardrobe/state/tripReducer.ts
src/features/wardrobe/state/tripReducer.test.ts
src/features/wardrobe/selectors/tripSelectors.ts
src/features/wardrobe/selectors/tripSelectors.test.ts
src/features/wardrobe/components/TripLookCard.tsx
src/features/wardrobe/components/PackingList.tsx
```

Modify:

```text
src/domain/wardrobe.ts
src/features/wardrobe/state/WardrobeContext.tsx
src/features/wardrobe/components/BottomNav.tsx
docs/testing/WEARABOUTS_UX_TEST_LOG.md
testing/README.md
```

## Implementation Tasks

### Task 1: Add Trip Domain Types

**Files:**

- Modify: `src/domain/wardrobe.ts`

- [ ] **Step 1: Add trip types**

Append these types after `MixerBodyPreview`:

```ts
export type TripStyleMode = "minimal" | "balanced" | "style_first";

export type TripLookStatus = "suggested" | "approved";

export interface TripDay {
  id: string;
  label: string;
  dateLabel: string;
  activity: string;
}

export interface TripLook {
  id: string;
  tripDayId: string;
  title: string;
  note: string;
  status: TripLookStatus;
  selections: OutfitSlotSelection[];
}

export interface DemoTrip {
  id: string;
  destination: string;
  dateRangeLabel: string;
  profileId: WardrobeProfileId;
  styleMode: TripStyleMode;
  baggageMode: "carry_on";
  days: TripDay[];
  note: string;
}

export interface PackingListItem {
  wardrobeItemId: string;
  wearCount: number;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: exits successfully.

- [ ] **Step 3: Commit**

```bash
git add src/domain/wardrobe.ts
git commit -m "Add trip planning domain types"
```

### Task 2: Add Trip Selectors With TDD

**Files:**

- Create: `src/features/wardrobe/selectors/tripSelectors.test.ts`
- Create: `src/features/wardrobe/selectors/tripSelectors.ts`

- [ ] **Step 1: Write failing selector tests**

Create `tripSelectors.test.ts` with tests for:

- `createTripLooks` returns one look per trip day.
- Existing saved outfit selections are used for the first day when available.
- `getPackingListItems` deduplicates wardrobe item IDs and counts repeats.

- [ ] **Step 2: Verify red**

Run: `npm run test -- src/features/wardrobe/selectors/tripSelectors.test.ts`

Expected: fails because `tripSelectors.ts` does not exist.

- [ ] **Step 3: Implement selectors**

Create `tripSelectors.ts` exporting:

```ts
export function createTripLooks(trip: DemoTrip, closetItems: WardrobeItem[], savedOutfits: SavedOutfit[]): TripLook[];
export function getPackingListItems(looks: TripLook[]): PackingListItem[];
```

Implementation rules:

- Use the first saved outfit for day one when available.
- For other days, use `getInitialMixerSelections(closetItems)`.
- Cycle suggested titles: `Arrival walk`, `Beach day`, `Dinner plan`.
- Cycle notes: `Easy travel layers`, `Light and sunny`, `Sharper evening option`.
- Packing list counts only non-null `wardrobeItemId` values.

- [ ] **Step 4: Verify green**

Run: `npm run test -- src/features/wardrobe/selectors/tripSelectors.test.ts`

Expected: selector tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/wardrobe/selectors/tripSelectors.ts src/features/wardrobe/selectors/tripSelectors.test.ts
git commit -m "Add trip look selectors"
```

### Task 3: Add Trip Fixtures And Reducer With TDD

**Files:**

- Create: `src/features/wardrobe/fixtures/demoTrip.ts`
- Create: `src/features/wardrobe/state/tripReducer.test.ts`
- Create: `src/features/wardrobe/state/tripReducer.ts`

- [ ] **Step 1: Create demo trip fixture**

Create `demoTrip.ts` exporting a three-day Goa trip for `profile-aankur`.

- [ ] **Step 2: Write failing reducer tests**

Test:

- `tripStarted` stores the trip and looks.
- `tripLookApproved` marks one look approved.
- `tripLookSwapped` replaces one day look and resets it to suggested.

- [ ] **Step 3: Verify red**

Run: `npm run test -- src/features/wardrobe/state/tripReducer.test.ts`

Expected: fails because `tripReducer.ts` does not exist.

- [ ] **Step 4: Implement reducer**

Create `tripReducer.ts` with `TripState`, `TripAction`, `initialTripState`, and `tripReducer`.

- [ ] **Step 5: Verify green**

Run: `npm run test -- src/features/wardrobe/state/tripReducer.test.ts`

Expected: reducer tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/wardrobe/fixtures/demoTrip.ts src/features/wardrobe/state/tripReducer.ts src/features/wardrobe/state/tripReducer.test.ts
git commit -m "Add trip planning reducer"
```

### Task 4: Wire Trip State Into Wardrobe Context

**Files:**

- Modify: `src/features/wardrobe/state/WardrobeContext.tsx`

- [ ] **Step 1: Add trip state and actions**

Expose:

```ts
tripState: TripState;
startDemoTrip: () => void;
approveTripLook: (lookId: string) => void;
swapTripLook: (lookId: string) => void;
```

`startDemoTrip` uses `demoTrip` plus `createTripLooks(state.closetItems, mixerState.savedOutfits)`.

- [ ] **Step 2: Verify**

Run:

```bash
npm run test
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/features/wardrobe/state/WardrobeContext.tsx
git commit -m "Wire trip state into wardrobe context"
```

### Task 5: Build Trip Looks UI

**Files:**

- Create: `src/features/wardrobe/components/TripLookCard.tsx`
- Create: `src/features/wardrobe/components/PackingList.tsx`
- Create: `app/trips/page.tsx`
- Modify: `src/features/wardrobe/components/BottomNav.tsx`

- [ ] **Step 1: Add `TripLookCard`**

Render day label, date, activity, look title, selected item count, note, status, and `Approve` / `Swap` buttons.

- [ ] **Step 2: Add `PackingList`**

Render packing list items by resolving `PackingListItem.wardrobeItemId` against closet items.

- [ ] **Step 3: Add `/trips` route**

Behavior:

- Empty state explains demo trip planning and links to `/upload` if closet is empty.
- Start button calls `startDemoTrip`.
- Shows trip header, day look cards, and packing list.
- `Approve` and `Swap` mutate client-side demo state.

- [ ] **Step 4: Update bottom nav**

Replace Home in bottom nav if needed or add five equal columns: Home, Closet, Add, Mixer, Trips.

- [ ] **Step 5: Verify**

Run:

```bash
npm run typecheck
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add app/trips/page.tsx src/features/wardrobe/components/TripLookCard.tsx src/features/wardrobe/components/PackingList.tsx src/features/wardrobe/components/BottomNav.tsx
git commit -m "Build trip looks demo route"
```

### Task 6: Test, Document, Push, And PR

**Files:**

- Modify: `docs/testing/WEARABOUTS_UX_TEST_LOG.md`
- Modify: `testing/README.md`
- Add screenshots under `testing/screenshots/`

- [ ] **Step 1: Run checks**

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 2: Browser test**

Test:

1. Upload demo batch.
2. Add All to closet.
3. Open Mixer and save a look.
4. Open Trips.
5. Start demo trip.
6. Approve one look.
7. Swap one look.
8. Confirm packing list updates from trip looks.

- [ ] **Step 3: Update testing docs and screenshots**

Add Phase 3 entry and screenshots for Trips and packing list.

- [ ] **Step 4: Confirm no providers**

```bash
rg -n "openai|anthropic|gemini|supabase|fetch\\(|axios|apiKey|SECRET" app src
rg -n "process\\.env" app src
```

Expected: no new provider integrations.

- [ ] **Step 5: Push and create PR**

```bash
git status --short
git push -u origin codex/phase-3-trip-looks-demo
gh pr create --base main --head codex/phase-3-trip-looks-demo --title "Build Phase 3 trip looks demo"
```
