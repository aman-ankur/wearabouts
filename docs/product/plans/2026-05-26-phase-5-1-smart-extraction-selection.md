# Wearabouts Phase 5.1 Smart Extraction Selection Implementation Plan

## Goal

Make outfit-photo ingestion fast and selective by default: scan broadly, let the user choose what to prepare, skip likely existing closet items by default, and avoid automatic shoe/accessory generation.

## Product Direction

User-facing language should focus on control, clarity, and avoiding duplicate closet items. Do not mention tokens, model calls, or price in the app UI.

Default real-mode upload flow:

1. User uploads an outfit photo.
2. Wearabouts scans the photo and detects visible candidates.
3. Review shows selectable candidates before image generation.
4. "Skip items already in Closet" is enabled by default.
5. Tops and bottoms are primary selectable pieces.
6. Shoes and accessories are optional secondary pieces.
7. The user can force-generate a likely duplicate if the match is wrong.

This solves repeated-photo cases such as one jeans appearing across ten T-shirt photos: Wearabouts can prepare the new top and avoid regenerating the jeans and shoes each time.

## Architecture

Add a deterministic extraction policy between OpenAI outfit detection and image generation. The policy assigns candidates to primary or optional groups, applies duplicate hints, and selects only user-requested/new core garments for generation.

Keep demo mode intact. Keep real single-item upload intact. Preserve Supabase persistence and Dev cache mode.

## Data And API Changes

- Add extraction mode to real upload requests:
  - `pick_after_scan` default for outfit photos.
  - `new_tops`
  - `new_bottoms`
  - `core_outfit`
- Store selection metadata on garment candidates:
  - `selection_status`: `primary`, `optional`, `skipped_existing`, `not_recommended`, `selected`
  - `selection_reason`
  - `duplicate_hint`
- Expose candidate choices on batch load so Review can render a picker before generation.
- Add an endpoint to generate selected candidate IDs from an existing batch/job.

## Pipeline Changes

- Outfit parent job should run detection first.
- In `pick_after_scan`, parent job becomes `ready` after detection if no candidates have been selected for generation yet.
- Candidate generation happens only after explicit selection or policy-selected mode.
- In `new_tops`, select high/medium visible tops and outerwear that are not duplicate-hinted.
- In `new_bottoms`, select high/medium visible bottoms that are not duplicate-hinted.
- In `core_outfit`, select one top/outerwear and one bottom by default. Shoes remain optional unless the user selects them.
- Accessories are never automatic in this phase.
- Use bounded concurrency of 2 for selected generation jobs.
- Skip validation for high-confidence visible tops/bottoms; validate medium confidence, needs-review visibility, footwear, accessories, and forced duplicate generations.

## Duplicate Handling

Phase 5.1 should use conservative duplicate hints. False negatives are acceptable; false positives must be reversible by user force-selection.

Initial implementation:

- Use local closet category matching plus simple name/category overlap as a duplicate hint.
- Mark likely matches as "Already in Closet" in the picker.
- Keep them selectable with a "Prepare anyway" action.

Future improvement:

- Visual embedding or perceptual image matching against closet assets.

## UX Changes

Upload page:

- Replace source-type-first copy with "What should Wearabouts prepare?"
- Default option: "Pick after scan"
- Secondary quick modes: "New tops", "New bottoms", "Core outfit"
- Add checkbox: "Skip items already in Closet" checked by default.
- Hide cost/time/token framing.

Review page:

- If an outfit batch has candidates but no generated garments, show a candidate picker.
- Primary section: tops, outerwear, bottoms.
- Optional section: shoes and accessories.
- Show likely duplicates with "Already in Closet" and allow "Prepare anyway."
- Generated review cards remain as-is after selected candidates finish.

Processing page:

- For detection-only jobs, copy should say "Scanning photo" and "Choose pieces" rather than implying everything is being generated.
- For selected generation, show that only selected pieces are being prepared.

## Testing Plan

TDD tests first:

1. Extraction policy:
   - classifies tops/bottoms as primary.
   - classifies shoes/accessories as optional.
   - excludes low confidence and occluded candidates from primary.
   - duplicate-hinted tops/bottoms are skipped by default but remain selectable.
   - `core_outfit` selects top and bottom, not shoes/accessories.
   - `new_tops` does not select repeated jeans.
   - `new_bottoms` does not select repeated tops.
2. Pipeline:
   - `pick_after_scan` creates candidates and no generated garments.
   - selected candidate generation creates only selected garments.
   - `core_outfit` creates only top/bottom candidate jobs.
   - parent job is ready when selected jobs finish.
   - high-confidence visible top/bottom generation skips validation.
3. Repository/mappers:
   - candidate selection metadata round-trips from Supabase.
   - batch load exposes candidates for Review.
4. UX:
   - upload defaults to pick-after-scan.
   - review renders candidate picker when no generated garments exist.
   - Dev cache path can exercise picker and generated-card flows without OpenAI.

## Verification

Run before completion:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Push the branch and open a PR against `main`.
