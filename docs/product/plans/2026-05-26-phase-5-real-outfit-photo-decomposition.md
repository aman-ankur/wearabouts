# Wearabouts Phase 5 Real Outfit Photo Decomposition

## Goal

Let real mode accept one outfit/person photo, detect multiple visible garments, generate one neutral studio closet asset per usable garment, and show one review card per generated item.

This phase directly follows the live Phase 4 test where an outfit photo produced only one overshirt. Phase 5 makes outfit-photo upload an explicit real-mode path while preserving standalone item upload, demo mode, and in-app Dev cache mode.

## Scope

In scope:

- Real Upload page supports `Item photo` and `Outfit photo`.
- One outfit source image is stored in Supabase.
- OpenAI metadata detects visible garment candidates in one call.
- Each usable candidate is prettified independently into a neutral studio asset.
- Review shows multiple generated garments for one outfit batch.
- Add and Add All move selected generated garments to Closet.
- Closet, Mixer, and Trips render the generated real assets through the existing wardrobe item path.
- Failed or low-confidence garment candidates do not block successful garments.
- Dev mode can create a multi-card review batch from cached closet assets without OpenAI calls.

Out of scope:

- Auth and multi-household access control.
- Avatar try-on.
- Transparent segmentation.
- Production queue workers.
- Batch upload of multiple source photos.
- Perfect extraction of occluded or barely visible garments.

## Architecture

Phase 5 adds an outfit decomposition service beside the existing Phase 4 single-item pipeline. The single-item path keeps its current behavior: one upload batch, one source image, one job, one detected garment.

The outfit path uses one parent `prettify_jobs` row for the whole outfit photo. Running that job downloads the source image, asks OpenAI for all visible garment candidates, stores candidate metadata, and then runs a per-candidate prettify step. Each successful candidate creates one `detected_garments` row for the existing review flow.

The parent outfit job is considered `ready` when at least one candidate produces a reviewable garment. It is `failed` only when detection fails completely or every candidate fails. Candidate failures are stored per candidate and surfaced as counts/context rather than blocking the whole batch.

## OpenAI Strategy

Use one metadata call for outfit decomposition. The response returns strict JSON with:

- `proposedName`
- `category`
- `confidence`
- `visibilityState`: `visible`, `occluded`, or `needs_review`
- `boundingBox`: normalized `x`, `y`, `width`, `height`
- `cropPrompt`
- `shouldPrettify`
- optional `reason`

Then crop each usable candidate before image edit. The crop is padded and clamped with `sharp`, then passed to the image model with a prompt that identifies the target garment and asks for a neutral studio asset preserving color, pattern, silhouette, logos, hems, and distinctive details.

This is preferred over passing the full outfit photo to every edit call because each edit request has a single target garment. It should reduce overshirt-only behavior and make pants, shoes, and accessories more likely to survive when visible.

## Confidence And Fallback Rules

- `high` and `medium` candidates with `visible` or `needs_review` visibility are eligible for prettify.
- `low` confidence or `occluded` candidates are stored as skipped candidates and do not create review cards.
- If only one garment is confidently detected, Wearabouts creates one review card and shows the source as an outfit photo. It does not invent missing garments.
- If no garment can be generated, the parent job is failed with a clear retry message.
- Validation failure marks that garment `needs_review` instead of blocking other candidates.

## Supabase Changes

Add a Phase 5 migration that preserves Phase 4 rows:

- Add `job_kind` to `prettify_jobs`: `single_item`, `outfit_parent`, `outfit_candidate`.
- Add `parent_job_id` to support child candidate jobs.
- Add `garment_candidate_id` to connect child jobs and detected garments to metadata.
- Add `garment_candidates` with batch/source/job references, category, proposed name, confidence, visibility, bounding box JSON, crop prompt, status, error, and optional detected garment id.
- Add candidate/source metadata columns to `detected_garments` so review cards can show outfit-photo context.

Existing Phase 4 jobs default to `single_item`.

## UX

Real Upload becomes a small mode chooser:

- `Item photo`: current single-garment path.
- `Outfit photo`: multi-garment decomposition path.
- `Dev`: local override that can exercise either mode without OpenAI.

Processing keeps the existing mobile-first stepper, but copy changes for outfit jobs:

- Upload
- Detect garments
- Prettify garments
- Validate assets
- Review

Review keeps the existing card stack and adds a compact source-context header for real outfit batches:

- Source badge: `Outfit photo`
- Generated count
- Skipped or needs-review count when relevant

## Testing

TDD targets:

- Candidate filtering and status decisions.
- Bounding-box clamping and crop sizing.
- Supabase mapper support for candidate/source metadata.
- Dev cache mode creating multiple outfit review cards.
- Pipeline behavior for partial success, one-garment fallback, and complete failure.

Manual UX testing:

- Real mode upload screen shows Item and Outfit choices.
- Dev mode can create a multi-card outfit review without OpenAI.
- Processing screen reaches Review for multi-garment batches.
- Review cards do not overlap and Add All moves generated assets to Closet.
- Demo upload/review/closet/mixer/trips remain intact.

## Verification

Before completion:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Push the feature branch and open a PR against `main`.
