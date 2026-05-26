# Wearabouts Phase 2 Closet Mixer Demo Implementation Plan

> **For agentic coding workers:** Implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Keep each task small, run the listed verification command before moving on, and commit working checkpoints.

**Goal:** Build the demo Closet Mixer: a mobile-first screen where a body preview stays centered while tops, bottoms, shoes, layers, and accessories can be swapped, locked, and saved as outfits.

**Architecture:** Extend the existing client-side demo state from Phase 0-1. Add outfit domain types, demo outfit fixtures, a reducer slice for mixer state, pure selector helpers for compatible rail items, and mobile UI components for the body stage and horizontal item rails. Keep this phase demo-only; do not add real AI, Supabase, image upload, or avatar generation.

**Tech Stack:** Next.js App Router, React, TypeScript, existing CSS globals, Vitest for pure domain/reducer tests, lucide-react for icons.

---

## Source Context

Read these files before starting:

- `AGENTS.md`
- `docs/product/PROJECT_CONTEXT.md`
- `docs/product/specs/2026-05-26-travogue-mvp-design.md`
- `docs/product/plans/2026-05-26-phase-0-1-foundation-upload-review.md`
- `docs/product/mockups/travogue-product-flows.html`

## Current Baseline

Phase 0-1 is already implemented:

- Home: `app/page.tsx`
- Upload: `app/upload/page.tsx`
- Review: `app/review/[batchId]/page.tsx`
- Closet: `app/closet/page.tsx`
- Wardrobe domain: `src/domain/wardrobe.ts`
- Wardrobe context/reducer: `src/features/wardrobe/state/`
- Demo fixtures/provider: `src/features/wardrobe/fixtures/demoWardrobe.ts`
- Visual garment renderer: `src/features/wardrobe/components/GarmentArtwork.tsx`

Before implementation, confirm baseline:

```bash
git switch main
git pull --ff-only
git switch -c codex/phase-2-closet-mixer
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected:

- All checks pass.
- Branch starts from `main`.
- Git identity is `aman-ankur <amanankur1110@gmail.com>`.

## Phase 2 Scope

Build:

- Outfit domain types.
- Demo outfit and body preview fixtures.
- Mixer reducer actions for selecting, locking, and saving outfits.
- Closet Mixer route at `/mixer`.
- Body preview stage using CSS/React primitives, not AI image generation.
- Horizontal rails for tops, bottoms, shoes, layers, and accessories.
- Lock/unlock controls for item slots.
- Save outfit action.
- Saved outfit list on the Closet page or a simple saved-look section.

Do not build:

- Real avatar generation.
- Real body photo upload.
- Supabase persistence.
- AI recommendations.
- Drag-and-drop.
- Gesture physics beyond scrollable horizontal rails.
- Trip assignment.

## Data Model Additions

Modify `src/domain/wardrobe.ts` by adding:

```ts
export type OutfitSlot = "top" | "bottom" | "shoes" | "layer" | "accessory";

export interface OutfitSlotSelection {
  slot: OutfitSlot;
  wardrobeItemId: string | null;
  locked: boolean;
}

export interface SavedOutfit {
  id: string;
  name: string;
  profileId: WardrobeProfileId;
  selections: OutfitSlotSelection[];
  createdAtIso: string;
}

export interface MixerBodyPreview {
  id: string;
  profileId: WardrobeProfileId;
  label: string;
  visualToken: "body-demo-aankur";
}
```

Acceptance:

- Existing Phase 0-1 tests still compile.
- New mixer state can refer to `WardrobeItem` IDs without duplicating item data.

## File Structure

Create:

```text
app/mixer/page.tsx
src/features/wardrobe/fixtures/demoMixer.ts
src/features/wardrobe/state/mixerReducer.ts
src/features/wardrobe/state/mixerReducer.test.ts
src/features/wardrobe/selectors/mixerSelectors.ts
src/features/wardrobe/selectors/mixerSelectors.test.ts
src/features/wardrobe/components/MixerBodyStage.tsx
src/features/wardrobe/components/MixerRail.tsx
src/features/wardrobe/components/MixerSlotControls.tsx
src/features/wardrobe/components/SavedOutfitList.tsx
```

Modify:

```text
src/domain/wardrobe.ts
src/features/wardrobe/state/WardrobeContext.tsx
src/features/wardrobe/state/wardrobeReducer.ts
src/features/wardrobe/state/wardrobeReducer.test.ts
src/features/wardrobe/fixtures/demoWardrobe.ts
src/features/wardrobe/components/BottomNav.tsx
app/closet/page.tsx
```

## Implementation Tasks

### Task 1: Add Outfit Domain Types

**Files:**

- Modify: `src/domain/wardrobe.ts`

- [ ] **Step 1: Add the types**

Append the "Data Model Additions" TypeScript to `src/domain/wardrobe.ts`.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: TypeScript exits successfully.

- [ ] **Step 3: Commit**

```bash
git add src/domain/wardrobe.ts
git commit -m "Add outfit mixer domain types"
```

### Task 2: Expand Demo Wardrobe Fixtures

**Files:**

- Modify: `src/features/wardrobe/fixtures/demoWardrobe.ts`
- Create: `src/features/wardrobe/fixtures/demoMixer.ts`

- [ ] **Step 1: Add more detected garments to demo wardrobe**

Add at least these demo items to `demoDetectedGarments`:

```ts
{
  id: "detected-striped-shirt",
  uploadBatchId: "batch-demo-upload",
  proposedName: "Striped Button Down Shirt",
  brand: "",
  category: "tops",
  ownerProfileId: "profile-aankur",
  sourceType: "item_photo",
  confidence: "high",
  prettifyStatus: "ready",
  isLayered: false,
  readyForMixer: true,
  asset: {
    id: "asset-striped-shirt",
    kind: "prettified",
    label: "Striped shirt prettified asset",
    visualToken: "shirt-striped"
  }
}
```

```ts
{
  id: "detected-charcoal-trouser",
  uploadBatchId: "batch-demo-upload",
  proposedName: "Charcoal Travel Trousers",
  brand: "",
  category: "bottoms",
  ownerProfileId: "profile-aankur",
  sourceType: "item_photo",
  confidence: "high",
  prettifyStatus: "ready",
  isLayered: false,
  readyForMixer: true,
  asset: {
    id: "asset-charcoal-trouser",
    kind: "prettified",
    label: "Charcoal trouser prettified asset",
    visualToken: "trouser-charcoal"
  }
}
```

```ts
{
  id: "detected-brown-shoe",
  uploadBatchId: "batch-demo-upload",
  proposedName: "Brown Loafers",
  brand: "",
  category: "footwear",
  ownerProfileId: "profile-aankur",
  sourceType: "item_photo",
  confidence: "high",
  prettifyStatus: "ready",
  isLayered: false,
  readyForMixer: true,
  asset: {
    id: "asset-brown-shoe",
    kind: "prettified",
    label: "Brown loafer prettified asset",
    visualToken: "shoe-brown"
  }
}
```

- [ ] **Step 2: Create `demoMixer.ts`**

```ts
import type { MixerBodyPreview } from "@/src/domain/wardrobe";

export const demoBodyPreview: MixerBodyPreview = {
  id: "body-demo-aankur",
  profileId: "profile-aankur",
  label: "Aankur demo body preview",
  visualToken: "body-demo-aankur",
};
```

- [ ] **Step 3: Run tests and typecheck**

```bash
npm run test
npm run typecheck
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/wardrobe/fixtures
git commit -m "Expand demo wardrobe for mixer"
```

### Task 3: Add Mixer Selectors With Tests

**Files:**

- Create: `src/features/wardrobe/selectors/mixerSelectors.ts`
- Create: `src/features/wardrobe/selectors/mixerSelectors.test.ts`

- [ ] **Step 1: Write failing selector tests**

Create `src/features/wardrobe/selectors/mixerSelectors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { getItemsForSlot, getInitialMixerSelections } from "./mixerSelectors";

const items: WardrobeItem[] = [
  {
    id: "wardrobe-top",
    sourceDetectedGarmentId: "detected-top",
    name: "Top",
    brand: "",
    category: "tops",
    ownerProfileId: "profile-aankur",
    asset: { id: "asset-top", kind: "prettified", label: "Top", visualToken: "shirt-striped" },
    addedAtIso: "2026-05-26T00:00:00.000Z",
    readyForMixer: true,
  },
  {
    id: "wardrobe-bottom",
    sourceDetectedGarmentId: "detected-bottom",
    name: "Bottom",
    brand: "",
    category: "bottoms",
    ownerProfileId: "profile-aankur",
    asset: { id: "asset-bottom", kind: "prettified", label: "Bottom", visualToken: "trouser-charcoal" },
    addedAtIso: "2026-05-26T00:00:00.000Z",
    readyForMixer: true,
  },
  {
    id: "wardrobe-not-ready",
    sourceDetectedGarmentId: "detected-not-ready",
    name: "Not Ready",
    brand: "",
    category: "tops",
    ownerProfileId: "profile-aankur",
    asset: { id: "asset-not-ready", kind: "prettified", label: "Not Ready", visualToken: "crew-wine" },
    addedAtIso: "2026-05-26T00:00:00.000Z",
    readyForMixer: false,
  },
];

describe("mixerSelectors", () => {
  it("returns only mixer-ready items for a slot", () => {
    expect(getItemsForSlot(items, "top").map((item) => item.id)).toEqual(["wardrobe-top"]);
    expect(getItemsForSlot(items, "bottom").map((item) => item.id)).toEqual(["wardrobe-bottom"]);
  });

  it("creates initial selections from available closet items", () => {
    expect(getInitialMixerSelections(items)).toEqual([
      { slot: "top", wardrobeItemId: "wardrobe-top", locked: false },
      { slot: "bottom", wardrobeItemId: "wardrobe-bottom", locked: false },
      { slot: "shoes", wardrobeItemId: null, locked: false },
      { slot: "layer", wardrobeItemId: null, locked: false },
      { slot: "accessory", wardrobeItemId: null, locked: false },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify red**

```bash
npm run test -- src/features/wardrobe/selectors/mixerSelectors.test.ts
```

Expected: fails because `mixerSelectors.ts` does not exist.

- [ ] **Step 3: Implement selectors**

Create `src/features/wardrobe/selectors/mixerSelectors.ts`:

```ts
import type { GarmentCategory, OutfitSlot, OutfitSlotSelection, WardrobeItem } from "@/src/domain/wardrobe";

const slotCategoryMap: Record<OutfitSlot, GarmentCategory[]> = {
  top: ["tops"],
  bottom: ["bottoms"],
  shoes: ["footwear"],
  layer: ["outerwear"],
  accessory: ["accessories"],
};

export const mixerSlots: OutfitSlot[] = ["top", "bottom", "shoes", "layer", "accessory"];

export function getItemsForSlot(items: WardrobeItem[], slot: OutfitSlot): WardrobeItem[] {
  const categories = slotCategoryMap[slot];
  return items.filter((item) => item.readyForMixer && categories.includes(item.category));
}

export function getInitialMixerSelections(items: WardrobeItem[]): OutfitSlotSelection[] {
  return mixerSlots.map((slot) => ({
    slot,
    wardrobeItemId: getItemsForSlot(items, slot)[0]?.id ?? null,
    locked: false,
  }));
}

export function getSelectedItem(items: WardrobeItem[], selection: OutfitSlotSelection): WardrobeItem | null {
  if (!selection.wardrobeItemId) {
    return null;
  }

  return items.find((item) => item.id === selection.wardrobeItemId) ?? null;
}
```

- [ ] **Step 4: Run selector tests**

```bash
npm run test -- src/features/wardrobe/selectors/mixerSelectors.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/wardrobe/selectors
git commit -m "Add mixer selectors"
```

### Task 4: Add Mixer Reducer With Tests

**Files:**

- Create: `src/features/wardrobe/state/mixerReducer.ts`
- Create: `src/features/wardrobe/state/mixerReducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Create `src/features/wardrobe/state/mixerReducer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { OutfitSlotSelection } from "@/src/domain/wardrobe";
import { initialMixerState, mixerReducer } from "./mixerReducer";

const selections: OutfitSlotSelection[] = [
  { slot: "top", wardrobeItemId: "top-1", locked: false },
  { slot: "bottom", wardrobeItemId: "bottom-1", locked: false },
  { slot: "shoes", wardrobeItemId: null, locked: false },
  { slot: "layer", wardrobeItemId: null, locked: false },
  { slot: "accessory", wardrobeItemId: null, locked: false },
];

describe("mixerReducer", () => {
  it("sets initial selections", () => {
    const state = mixerReducer(initialMixerState, { type: "mixerStarted", selections });
    expect(state.selections).toEqual(selections);
  });

  it("selects an item for an unlocked slot", () => {
    const started = mixerReducer(initialMixerState, { type: "mixerStarted", selections });
    const state = mixerReducer(started, { type: "slotItemSelected", slot: "top", wardrobeItemId: "top-2" });
    expect(state.selections.find((selection) => selection.slot === "top")?.wardrobeItemId).toBe("top-2");
  });

  it("does not select an item for a locked slot", () => {
    const started = mixerReducer(initialMixerState, { type: "mixerStarted", selections });
    const locked = mixerReducer(started, { type: "slotLockToggled", slot: "top" });
    const state = mixerReducer(locked, { type: "slotItemSelected", slot: "top", wardrobeItemId: "top-2" });
    expect(state.selections.find((selection) => selection.slot === "top")?.wardrobeItemId).toBe("top-1");
  });

  it("saves the current outfit", () => {
    const started = mixerReducer(initialMixerState, { type: "mixerStarted", selections });
    const state = mixerReducer(started, {
      type: "outfitSaved",
      outfitId: "outfit-1",
      name: "Tokyo walking look",
      profileId: "profile-aankur",
      createdAtIso: "2026-05-26T00:00:00.000Z",
    });

    expect(state.savedOutfits).toHaveLength(1);
    expect(state.savedOutfits[0]?.name).toBe("Tokyo walking look");
    expect(state.savedOutfits[0]?.selections).toEqual(selections);
  });
});
```

- [ ] **Step 2: Run test to verify red**

```bash
npm run test -- src/features/wardrobe/state/mixerReducer.test.ts
```

Expected: fails because `mixerReducer.ts` does not exist.

- [ ] **Step 3: Implement reducer**

Create `src/features/wardrobe/state/mixerReducer.ts`:

```ts
import type { OutfitSlot, OutfitSlotSelection, SavedOutfit, WardrobeProfileId } from "@/src/domain/wardrobe";

export interface MixerState {
  selections: OutfitSlotSelection[];
  savedOutfits: SavedOutfit[];
}

export type MixerAction =
  | { type: "mixerStarted"; selections: OutfitSlotSelection[] }
  | { type: "slotItemSelected"; slot: OutfitSlot; wardrobeItemId: string | null }
  | { type: "slotLockToggled"; slot: OutfitSlot }
  | {
      type: "outfitSaved";
      outfitId: string;
      name: string;
      profileId: WardrobeProfileId;
      createdAtIso: string;
    };

export const initialMixerState: MixerState = {
  selections: [],
  savedOutfits: [],
};

export function mixerReducer(state: MixerState, action: MixerAction): MixerState {
  switch (action.type) {
    case "mixerStarted":
      return { ...state, selections: action.selections };

    case "slotItemSelected":
      return {
        ...state,
        selections: state.selections.map((selection) => {
          if (selection.slot !== action.slot || selection.locked) {
            return selection;
          }

          return { ...selection, wardrobeItemId: action.wardrobeItemId };
        }),
      };

    case "slotLockToggled":
      return {
        ...state,
        selections: state.selections.map((selection) =>
          selection.slot === action.slot ? { ...selection, locked: !selection.locked } : selection,
        ),
      };

    case "outfitSaved":
      return {
        ...state,
        savedOutfits: [
          ...state.savedOutfits,
          {
            id: action.outfitId,
            name: action.name,
            profileId: action.profileId,
            selections: state.selections,
            createdAtIso: action.createdAtIso,
          },
        ],
      };
  }
}
```

- [ ] **Step 4: Run reducer tests**

```bash
npm run test -- src/features/wardrobe/state/mixerReducer.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/wardrobe/state/mixerReducer.ts src/features/wardrobe/state/mixerReducer.test.ts
git commit -m "Add mixer state reducer"
```

### Task 5: Integrate Mixer State Into Wardrobe Context

**Files:**

- Modify: `src/features/wardrobe/state/WardrobeContext.tsx`

- [ ] **Step 1: Add mixer state to context**

Modify `WardrobeContext.tsx` so it imports:

```ts
import type { OutfitSlot, OutfitSlotSelection, WardrobeProfileId } from "@/src/domain/wardrobe";
import { getInitialMixerSelections } from "@/src/features/wardrobe/selectors/mixerSelectors";
import { initialMixerState, mixerReducer, type MixerState } from "./mixerReducer";
```

Extend `WardrobeContextValue` with:

```ts
mixerState: MixerState;
startMixer: () => void;
selectMixerItem: (slot: OutfitSlot, wardrobeItemId: string | null) => void;
toggleMixerSlotLock: (slot: OutfitSlot) => void;
saveCurrentOutfit: (name: string, profileId: WardrobeProfileId) => void;
```

Inside `WardrobeProvider`, add:

```ts
const [mixerState, mixerDispatch] = useReducer(mixerReducer, initialMixerState);
```

Add these methods to `value`:

```ts
mixerState,
startMixer() {
  mixerDispatch({
    type: "mixerStarted",
    selections: getInitialMixerSelections(state.closetItems),
  });
},
selectMixerItem(slot, wardrobeItemId) {
  mixerDispatch({ type: "slotItemSelected", slot, wardrobeItemId });
},
toggleMixerSlotLock(slot) {
  mixerDispatch({ type: "slotLockToggled", slot });
},
saveCurrentOutfit(name, profileId) {
  mixerDispatch({
    type: "outfitSaved",
    outfitId: `outfit-${Date.now()}`,
    name,
    profileId,
    createdAtIso: new Date().toISOString(),
  });
},
```

- [ ] **Step 2: Run tests and typecheck**

```bash
npm run test
npm run typecheck
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/wardrobe/state/WardrobeContext.tsx
git commit -m "Wire mixer state into wardrobe context"
```

### Task 6: Add Mixer UI Components

**Files:**

- Create: `src/features/wardrobe/components/MixerBodyStage.tsx`
- Create: `src/features/wardrobe/components/MixerRail.tsx`
- Create: `src/features/wardrobe/components/MixerSlotControls.tsx`
- Create: `src/features/wardrobe/components/SavedOutfitList.tsx`

- [ ] **Step 1: Create `MixerBodyStage.tsx`**

Use CSS primitives to create a centered body preview. Render selected top/layer/bottom/shoes by reusing `GarmentArtwork` tokens in approximate positions. Keep it deliberately stylized, not photoreal.

Component API:

```ts
interface MixerBodyStageProps {
  selectedItems: Partial<Record<OutfitSlot, WardrobeItem>>;
}
```

- [ ] **Step 2: Create `MixerRail.tsx`**

Component API:

```ts
interface MixerRailProps {
  slot: OutfitSlot;
  label: string;
  items: WardrobeItem[];
  selectedItemId: string | null;
  locked: boolean;
  onSelect: (wardrobeItemId: string) => void;
}
```

Behavior:

- Horizontal scroll.
- Shows `GarmentArtwork` for each item.
- Selected item has a visible border.
- If `locked`, buttons are disabled and opacity is reduced.

- [ ] **Step 3: Create `MixerSlotControls.tsx`**

Component API:

```ts
interface MixerSlotControlsProps {
  selections: OutfitSlotSelection[];
  onToggleLock: (slot: OutfitSlot) => void;
}
```

Behavior:

- Shows one compact lock/unlock pill per slot.
- Uses `Lock` and `Unlock` icons from `lucide-react`.

- [ ] **Step 4: Create `SavedOutfitList.tsx`**

Component API:

```ts
interface SavedOutfitListProps {
  outfits: SavedOutfit[];
}
```

Behavior:

- Empty state: "No saved looks yet."
- Otherwise list outfit name, profile, and selected item count.

- [ ] **Step 5: Run typecheck**

```bash
npm run typecheck
```

Expected: TypeScript exits successfully.

- [ ] **Step 6: Commit**

```bash
git add src/features/wardrobe/components/MixerBodyStage.tsx src/features/wardrobe/components/MixerRail.tsx src/features/wardrobe/components/MixerSlotControls.tsx src/features/wardrobe/components/SavedOutfitList.tsx
git commit -m "Add closet mixer UI components"
```

### Task 7: Build Mixer Route

**Files:**

- Create: `app/mixer/page.tsx`
- Modify: `src/features/wardrobe/components/BottomNav.tsx`

- [ ] **Step 1: Add Mixer link to bottom nav**

Modify `BottomNav.tsx` to include `/mixer` as the fourth item. Keep `/review/batch-demo-upload` out of the persistent nav.

Final nav items:

- Home
- Closet
- Add
- Mixer

- [ ] **Step 2: Create `app/mixer/page.tsx`**

Behavior:

- On first render, call `startMixer()` if mixer selections are empty.
- If closet has no mixer-ready items, show a card linking to `/upload`.
- Show `MixerBodyStage`.
- Show `MixerSlotControls`.
- Show `MixerRail` for each slot.
- Save button calls `saveCurrentOutfit("Demo travel look", "profile-aankur")`.

- [ ] **Step 3: Run typecheck and build**

```bash
npm run typecheck
npm run build
```

Expected:

- TypeScript exits successfully.
- Build includes `/mixer`.

- [ ] **Step 4: Commit**

```bash
git add app/mixer/page.tsx src/features/wardrobe/components/BottomNav.tsx
git commit -m "Build closet mixer demo route"
```

### Task 8: Show Saved Looks In Closet

**Files:**

- Modify: `app/closet/page.tsx`

- [ ] **Step 1: Add saved outfit list**

Import `SavedOutfitList` and render it below `ClosetGrid`:

```tsx
<div style={{ marginTop: 16 }}>
  <SavedOutfitList outfits={mixerState.savedOutfits} />
</div>
```

Read `mixerState` from `useWardrobe()`.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: TypeScript exits successfully.

- [ ] **Step 3: Commit**

```bash
git add app/closet/page.tsx
git commit -m "Show saved mixer looks in closet"
```

### Task 9: Verify Phase 2 End To End

**Files:**

- Verify all app files.

- [ ] **Step 1: Run automated checks**

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected:

- All tests pass.
- TypeScript exits successfully.
- Lint exits successfully.
- Production build completes.

- [ ] **Step 2: Run local server**

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Expected: local server starts at `http://127.0.0.1:3000`.

- [ ] **Step 3: Manual verification**

In the browser:

1. Go to `/upload`.
2. Choose `Batch upload`.
3. On review, click `Add All`.
4. Confirm `/closet` shows approved demo items.
5. Go to `/mixer`.
6. Confirm body stage renders.
7. Confirm rails render for available slots.
8. Select a different top.
9. Lock the top slot.
10. Try another top and confirm locked slot does not change.
11. Save the outfit.
12. Go to `/closet`.
13. Confirm saved outfit appears.

- [ ] **Step 4: Confirm no real providers**

```bash
rg -n "openai|anthropic|gemini|supabase|fetch\\(|axios|apiKey|SECRET" app src
rg -n "process\\.env" app src
```

Expected:

- First command returns no matches.
- Second command only returns `NEXT_PUBLIC_TRAVOGUE_MODE` in `src/features/runtime/runtimeMode.ts`.

- [ ] **Step 5: Push branch**

```bash
git status --short
git push -u origin codex/phase-2-closet-mixer
```

Expected:

- Working tree clean before push.
- Branch is available on GitHub for PR creation.

## Acceptance Criteria

- `/mixer` route exists.
- Existing Phase 0-1 upload/review/closet flow still works.
- User can add demo items to closet.
- User can open Mixer and see a body preview.
- User can select items in horizontal rails.
- User can lock/unlock slots.
- Locked slots do not change when selecting another item.
- User can save a demo outfit.
- Closet shows saved outfits.
- `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- No real AI, Supabase, or network provider integration exists.

## Handoff For New Chat

Start a new chat with:

```text
Please read AGENTS.md, docs/product/PROJECT_CONTEXT.md, and docs/product/plans/2026-05-26-phase-2-closet-mixer-demo.md, then implement Phase 2 on a new codex/phase-2-closet-mixer branch.
```

