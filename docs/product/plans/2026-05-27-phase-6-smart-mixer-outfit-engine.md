# Phase 6 Smart Mixer + Outfit Engine Implementation Handoff

**Status:** Implemented as the first end-to-end Phase 6 slice on `codex/phase6-smart-mixer`.

**Goal:** Mixer should open with complete outfit suggestions from real/demo wardrobe items, show honest outfit-board previews, let the user save or refine a look, and keep the outfit logic reusable for Trip Planner and daily recommendations.

## Locked Product Decisions

- Mixer opens as a suggestions-first experience, not a manual slot builder.
- Suggestions use flat outfit-board previews from real closet assets.
- No avatar, mannequin, or body try-on is included in this phase.
- A suggestion can be saved directly or opened in Refine.
- Refine preserves locked slots and shows ranked alternatives for the active slot.
- `Not this` and `More like this` are local session feedback controls for now, not persistent learning.
- Sparse closets should fail gracefully instead of showing an empty board.

## Current User Flow

1. User adds mixer-ready wardrobe items from Upload/Review.
2. User opens `/mixer`.
3. If enough items exist, Mixer shows `Look X of N`, dots, Previous/Next, and a single focused outfit card.
4. Each outfit card includes:
   - board preview
   - title
   - intent
   - confidence label
   - score
   - rationale
   - item names
   - `Save look`
   - `Refine`
   - `Not this`
   - `More like this`
5. `Save look` stores the suggestion as a saved outfit.
6. `Refine` opens the smart board view.
7. In Refine, the user can:
   - switch active slot
   - lock/unlock slots
   - choose ranked alternatives for unlocked slots
   - save the refined look
8. Saved looks appear in the existing Closet saved-look section.

## Button Behavior

`Not this`

- Removes the current suggestion from the current session.
- Advances to the next available look.
- If all suggestions are dismissed, Mixer shows a reviewed-all state and lets the user restore suggestions.
- Future phase: persist this as a negative feedback signal for the outfit engine.

`More like this`

- Uses the current suggestion as a temporary similarity anchor.
- Reorders the current suggestion set by item overlap and score.
- Jumps into the closest matching alternatives.
- Future phase: persist this as a positive feedback signal and use richer style metadata, not only item overlap.

`Previous` / `Next`

- Browse the ranked suggestion set without accepting or rejecting a look.
- The top pill count is the total available suggestion count after filtering dismissed looks.

## Outfit Engine Architecture

Reusable outfit modules live under:

```text
src/features/wardrobe/outfits/
  outfitTypes.ts
  outfitCompatibilityScorer.ts
  outfitRecommendationService.ts
  outfitSuggestionProvider.ts
  outfitRefinement.ts
  outfitFeedback.ts
```

Responsibilities:

- `outfitTypes.ts`: shared intent, suggestion, refinement, alternative, and feedback types.
- `outfitCompatibilityScorer.ts`: deterministic item scoring for intent/category/style defaults.
- `outfitSuggestionProvider.ts`: builds valid complete outfit candidates and ranks them.
- `outfitRecommendationService.ts`: public recommendation entry point used by Mixer.
- `outfitRefinement.ts`: ranked slot alternatives and swap logic.
- `outfitFeedback.ts`: placeholder/adapter for future persistent feedback signals.

The UI should continue calling the outfit layer instead of hand-building combinations.

## Recommendation Rules

Current deterministic rules:

- Required: at least one top or outerwear, plus one bottom.
- Optional: shoes, layer, accessory.
- Only uses `readyForMixer` items owned by the active profile or shared profile.
- Avoids selecting the same wardrobe item twice in one outfit.
- Tolerates thin metadata by falling back to category, item name, and deterministic defaults.
- Returns up to 5 ranked suggestions.
- Newer equivalent items win tie-breaks so recently added/replaced closet assets appear first.
- Missing shoes produce a warning instead of blocking suggestions.

## Visual Direction

The current board is intentionally an honest flat-lay, not body try-on.

- It uses a single clean white board surface.
- Item borders/background boxes were removed.
- Asset backgrounds are visually minimized with scale/placement/soft masking where safe.
- Pants and shoes are not edge-masked because masking cropped important corners.
- The board accepts imperfect non-transparent assets for now.

Important limitation:

- Clothing assets are not guaranteed transparent cutouts yet. The UI hides this as much as possible, but true transparent/segmented assets should be addressed in a later asset pipeline phase.

## Upload/Review Flow Fixes Included

Phase 6 testing exposed upload/review issues that were fixed in the same branch:

- Adding detected garments to the wardrobe removes them from the review list.
- Review no longer bounces back to the candidate picker after selected garments are added.
- Candidate generation is idempotent when a candidate is already ready.
- Outfit parent jobs can return existing review garments/candidates without duplicating work.
- `Add all` / individual add behavior is covered by reducer and pipeline tests.

## Cache And Cost Behavior

Current behavior is partially cache-aware, but not a full same-image cache.

- Dev cached upload can create review garments from existing wardrobe items without AI spend.
- Re-running an already-ready job returns existing detected garments/candidates instead of regenerating.
- Generating selected candidates skips candidates that are already `ready`.
- Duplicate detection can mark existing closet-like candidates during outfit detection when closet lookup succeeds.

Not implemented yet:

- Content-hash or perceptual-hash cache for a newly uploaded identical image.
- Cross-batch reuse of previous AI detection/prettify results for the exact same photo.
- Persistent feedback-aware reranking.

Product implication:

- Uploading the same photo again may still create a new batch and can still spend AI tokens in real mode unless it hits an already-ready job/candidate path inside the same batch. A future cache phase should add source-image hashing before AI detection/prettify.

## Tests Added Or Updated

- Outfit suggestion generation and ranking.
- Outfit refinement alternatives and slot swapping.
- Newer equivalent item tie-break behavior.
- Mixer board rendering without placeholder accessory slot.
- Mixer reducer saved-outfit metadata.
- Real wardrobe pipeline candidate generation/idempotency/add-to-closet behavior.

## Verification

Last verified on this branch with:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

All four commands passed before creating the PR.

## Next Phase Recommendations

1. Add source-image hash caching before AI calls.
2. Persist `Not this`, `More like this`, and saved-look feedback signals.
3. Add richer wardrobe metadata from real garment analysis:
   - colors
   - pattern
   - formality
   - season
   - material
   - style tags
   - warmth
   - rain suitability
4. Promote the outfit engine into Trip Planner day-look generation.
5. Add named intents beyond the current fixed dinner default in Mixer.
6. Improve asset transparency/segmentation so the board can become cleaner without masking tricks.
7. Add true horizontal swipe gestures or a more native carousel once the explicit pager behavior is stable.
