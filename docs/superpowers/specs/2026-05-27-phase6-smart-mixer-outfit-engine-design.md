# Phase 6 Smart Mixer + Outfit Engine Design

## Summary

Phase 6 turns Wearabouts from a wardrobe ingestion tool into a wardrobe styling tool.

The user has added enough real wardrobe items to make the closet useful. They open Mixer and immediately see complete outfit suggestions made from their own clothes. Each suggestion is shown as an honest outfit board, not as avatar try-on. The user can save a good look, reject a bad one, ask for more like it, or refine the outfit by locking pieces and swapping alternatives.

The core product decision is locked:

> Mixer opens with complete swipeable outfit suggestions. Refinement opens a smart board with locks, swaps, and prompt-style changes.

This creates the reusable outfit intelligence layer that Trip Planner and daily "what should I wear?" can use later.

Supporting mockup:

- `docs/product/mockups/2026-05-27-phase6-mixer-options.html`

Implementation handoff:

- `docs/product/plans/2026-05-27-phase-6-smart-mixer-outfit-engine.md`

Current implementation status:

- The first end-to-end Phase 6 slice is implemented on `codex/phase6-smart-mixer`.
- Mixer now opens with complete outfit suggestions when enough closet items exist.
- Refinement supports slot locks and ranked alternatives.
- Saved suggested/refined looks flow into the existing saved-look model.
- Feedback buttons are session-local only; persistent learning is a next-phase task.
- Same-image upload cache is not complete; add source-image hashing before AI calls in a future cache/cost phase.

## Primary User Story

As a Wearabouts user with a real closet, I want to open Mixer and quickly see complete outfits from my wardrobe, so I can save looks I like and refine them without manually building every combination.

## Success Moment

The first success moment is:

1. User adds several real wardrobe items.
2. User opens Mixer.
3. Wearabouts shows 3-5 credible outfit suggestions.
4. User saves one look or refines it by locking one item and swapping another.

The user should feel:

- The closet is now useful.
- Wearabouts has enough taste to suggest a starting point.
- They remain in control.
- No avatar is required for the flow to be valuable.

## Non-Goals

Phase 6 does not build:

- Avatar creation.
- Body try-on.
- Trip Planner generation.
- Daily recommendation flow.
- Weather API integration.
- Shopping recommendations.
- Social sharing.
- Fully AI-autonomous styling with no deterministic guardrails.

Avatar comes after the app can produce saved outfits worth rendering.

## Experience Design

### Entry Point

The `Mixer` tab becomes the primary post-closet playground.

If the closet has enough mixer-ready items, the page opens to suggested outfits.

If the closet is sparse, the page shows a useful empty state:

- "Add at least one top and one bottom to start mixing."
- If shoes are missing, still allow top/bottom suggestions and mark shoes as optional.
- Link back to Upload and Closet.

### Suggested Looks View

The main Mixer screen shows one primary complete outfit card at a time, with subtle carousel affordances for nearby suggestions. This keeps the screen focused and mobile-friendly while still making it feel easy to browse more looks.

Each card includes:

- Outfit board preview.
- Suggested title, such as `Easy dinner look`.
- Profile label, such as `Aankur`.
- Intent tag, such as `Casual`, `Dinner`, `Travel day`, or `Warm weather`.
- Styling score or confidence label.
- Items used.
- Short rationale.
- Actions:
  - `Save look`
  - `Refine`
  - `Not this`
  - `More like this`

The board uses real closet asset images. It arranges pieces as a flat-lay:

- Top or outerwear as the visual anchor.
- Bottoms adjacent.
- Shoes below.
- Layer/accessory as smaller supporting pieces.

This keeps the product honest before avatar setup exists.

### Smart Board Refine View

When the user taps `Refine`, Wearabouts opens the selected suggestion as a single editable outfit board.

The refine view includes:

- Central outfit board.
- Slot locks:
  - Top
  - Bottom
  - Shoes
  - Layer
  - Accessory
- Ranked alternatives for the active slot.
- Quick prompts:
  - `More casual`
  - `Dinner-ready`
  - `Better for travel`
  - `Less black`
  - `Keep these pants`
- Actions:
  - `Save look`
  - `Back to suggestions`

Locks are the most important control. If the user locks pants and asks for more casual, the engine changes only compatible unlocked pieces.

### Saved Looks

Saved looks become first-class objects, not just demo rows.

A saved look should store:

- Profile.
- Items selected by slot.
- Original suggestion intent.
- User-edited title.
- Created date.
- Feedback signals that produced it, if any.

Saved looks are later consumed by:

- Trip Planner.
- Daily recommendations.
- Avatar render.

## Technical Design

### Architecture

Add a reusable outfit recommendation layer beneath Mixer.

Suggested modules:

```text
src/features/wardrobe/outfits/
  outfitTypes.ts
  outfitRecommendationService.ts
  outfitCompatibilityScorer.ts
  outfitSuggestionProvider.ts
  outfitRefinement.ts
  outfitFeedback.ts
```

The UI should not directly hand-roll outfit combinations. It asks the outfit layer for suggestions and refinement alternatives.

### Core Concepts

`OutfitIntent`

Represents why the outfit is being built.

Initial values:

- `casual`
- `dinner`
- `travel_day`
- `work`
- `warm_weather`
- `rain_ready`

`OutfitSuggestion`

Represents one ranked complete look.

Fields:

- `id`
- `profileId`
- `intent`
- `title`
- `score`
- `rationale`
- `selections`
- `warnings`

`OutfitSuggestionContext`

Input to the outfit engine.

Fields:

- `profileId`
- `intent`
- `closetItems`
- `savedOutfits`
- `feedbackSignals`
- `lockedSelections`
- `maxSuggestions`

`OutfitSlotSelection`

Use the existing slot shape where possible:

- `top`
- `bottom`
- `shoes`
- `layer`
- `accessory`

### Wardrobe Metadata

Current real wardrobe items are useful visually but thin for styling. Phase 6 should add optional metadata that improves outfit quality without blocking old items.

Add or expose metadata for:

- `colors`
- `pattern`
- `formality`
- `season`
- `occasionTags`
- `material`
- `styleTags`
- `warmth`
- `rainSuitability`

For new real uploads, enrich metadata through the existing OpenAI garment analysis path.

For existing items, fall back to:

- category
- item name
- profile
- readiness
- basic deterministic defaults

No existing closet item should break because metadata is missing.

### Recommendation Strategy

Use deterministic scoring first. Add AI later only for explanations or reranking after candidate generation is reliable.

The first scorer should:

1. Group closet items by slot.
2. Build valid outfit candidates.
3. Reject incomplete combinations when a required slot is missing.
4. Score combinations by:
   - category completeness
   - color compatibility
   - formality alignment
   - intent alignment
   - profile ownership
   - reuse/novelty balance
   - user feedback
5. Return the top 3-5 suggestions.

Required slots for Phase 6:

- Top or outerwear.
- Bottom.

Optional slots:

- Shoes.
- Layer.
- Accessory.

If shoes are missing, the suggestion should still work and explain that shoes can be added later.

### Refinement Strategy

Refinement takes a current suggestion plus a requested change.

Examples:

- Lock pants, change top.
- Make it more casual.
- Make it dinner-ready.
- Keep shoes, change everything else.

The refine engine should:

1. Preserve locked slots.
2. Generate alternatives only for unlocked slots.
3. Prefer alternatives compatible with the locked pieces.
4. Return ranked replacements with short reasons.
5. Update the active outfit board without leaving the refine view.

### Feedback Signals

Phase 6 should capture simple feedback, even if personalization remains light.

Signals:

- `saved`
- `rejected`
- `more_like_this`
- `refined`
- `slot_locked`
- `slot_swapped`

These signals become useful later for trip and daily recommendations.

## UI Design Direction

The interface should feel like a premium utility, not a marketing page.

Style principles:

- Mobile-first.
- Dense but calm.
- Mostly black, white, warm grey, and actual garment color.
- Cards at 8px radius.
- Icon or compact controls for repeated actions.
- No fake mannequin or body overlay in Phase 6.
- Outfit boards should make real items inspectable.

Suggested visual hierarchy:

1. Top app bar: `Smart Mixer`, profile, settings/filter.
2. Intent chips.
3. Suggested outfit card.
4. Actions.
5. Bottom nav.

## Data Flow

### Suggestions

```text
Closet items
  -> filter mixer-ready items
  -> enrich/normalize metadata
  -> build candidate outfits
  -> score and rank
  -> render suggested outfit cards
```

### Refinement

```text
Selected suggestion
  -> user locks slots or picks prompt
  -> generate replacement candidates
  -> score alternatives against locked items
  -> update outfit board
  -> save final look
```

### Saved Look

```text
Final outfit selections
  -> saved look record
  -> closet saved looks section
  -> future trip planner input
  -> future avatar render input
```

## Error And Empty States

Closet has no items:

- Show "Add clothes to start mixing."
- Link to Upload.

Closet has only tops:

- Show "Add bottoms for complete looks."
- Still show a small "tops ready" closet summary.

Closet has one top and one bottom:

- Generate one suggestion.
- Hide carousel affordances that imply many looks.

No compatible suggestions:

- Show manual Smart Board builder with available items.
- Explain which missing categories would help.

Real asset image fails:

- Keep the card layout intact.
- Show item name and category fallback.

## Testing Plan

Unit tests:

- Generates complete suggestions from real closet items.
- Does not reuse the same item in multiple slots.
- Handles missing shoes.
- Handles missing metadata.
- Scores intent-aligned outfits higher.
- Preserves locked slots during refinement.
- Returns alternatives only for unlocked slots.
- Records feedback actions.

Component tests:

- Suggested look cards render real closet asset artwork.
- Sparse closet empty states render the correct call to action.
- Refine view shows locked slots and ranked alternatives.

Manual UX tests:

- Real-mode closet items appear in Mixer suggestions.
- User can save a suggestion.
- User can refine a suggestion by locking pants and changing top.
- Saved look appears in Closet.
- Demo mode still works.

Verification before completion:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Phase 6 Deliverables

1. Real closet-backed suggestion cards in Mixer.
2. Outfit recommendation service with deterministic scoring.
3. Smart Board refinement flow.
4. Saved looks from real wardrobe items.
5. Feedback signals for future personalization.
6. Metadata enrichment support for new real wardrobe items.
7. Graceful sparse-closet states.

## Follow-Up Phases

### Phase 7: Trip Planner On Outfit Engine

Trip Planner should ask the same outfit engine for multiple contexts:

- travel day
- daytime activity
- dinner
- special event

Approved trip looks derive the packing list.

### Phase 8: Daily / Tonight Recommendations

Daily recommendations reuse the same engine with a smaller context:

- tonight
- work tomorrow
- rainy casual day
- dinner out

### Phase 9: Avatar Creation And Render

Avatar setup begins once saved looks exist.

Flow:

1. User saves a look.
2. App offers "Preview this on me."
3. User sets up avatar with face and full-body photos.
4. High-quality render is generated only for selected/saved looks.

This keeps avatar generation purposeful and avoids making fake try-on the foundation of the product.
