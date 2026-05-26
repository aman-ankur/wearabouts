# Wearabouts Phase 5.1 Live Benchmark Checklist

Use this when testing real outfit-photo upload with Supabase and OpenAI enabled.

## Baseline From Phase 5

- One outfit photo generated 4 assets: T-shirt, pants, shoes, smartwatch.
- Approximate latency: 2+ minutes.
- Approximate cost: close to $1.
- Main issue: every medium/high visible candidate generated immediately.

## Phase 5.1 Targets

### Pick After Scan

- Upload to picker should run detection only.
- Expected generation count before picker: `0`.
- Expected candidates: broad list of visible garments.
- Shoes/accessories should be optional, not selected first.
- Likely existing closet items should be marked as already in Closet but still selectable.

### Pants-Only Or Top-Only

- Select exactly one candidate from the picker.
- Expected image generations: `1`.
- Expected validation calls:
  - `0` for high-confidence visible top/bottom.
  - `1` for medium-confidence, needs-review, footwear, accessory, or forced duplicate.
- Expected latency: image model dependent, but materially below the old 4-item run.

### Core Outfit

- Expected automatic generations: top/outerwear + bottom.
- Expected automatic shoe/accessory generations: `0`.
- Expected selected candidate count: usually `2`.

## Terminal Logs To Capture

Filter for:

```text
wearabouts.telemetry
```

Important events:

- `api.upload.started`
- `api.upload.completed`
- `api.job_run.started`
- `openai.detect_outfit.completed`
- `pipeline.outfit_detection.planned`
- `pipeline.outfit_detection.ready_for_picker`
- `api.candidate_generate.started`
- `pipeline.candidate_generation.started`
- `openai.image_edit.completed`
- `pipeline.validation.skipped`
- `openai.validate_asset.completed`
- `pipeline.selected_candidates.completed`
- `api.candidate_generate.completed`

## Numbers To Record

- Upload-to-picker wall-clock time.
- Picker candidate count.
- Candidate statuses:
  - primary
  - optional
  - skipped_existing
  - not_recommended
- Selected candidate count.
- Image edit count.
- Validation call count.
- Sum of `estimatedOutputCostUsd` from `openai.image_edit.completed`.
- Actual OpenAI usage/cost from dashboard for the same time window.

## Pass Criteria

- Default upload does not generate shoes or accessories before user selection.
- Default upload reaches picker with 0 image edits.
- Selecting one top or bottom produces one generated review card.
- Core outfit mode generates at most top/outerwear and bottom.
- Existing closet duplicate hints are reversible by selecting the candidate anyway.
