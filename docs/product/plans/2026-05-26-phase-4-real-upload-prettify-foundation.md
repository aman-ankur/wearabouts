# Wearabouts Phase 4 Real Upload + Auto-Prettify Foundation

## Goal

Build the first real pipeline proof while preserving the existing demo mode:

- Upload one standalone clothing photo.
- Store the source image in private Supabase storage.
- Analyze the garment with OpenAI.
- Generate a neutral studio-style closet asset.
- Validate that the generated asset still matches the source.
- Show processing status before review.
- Add the generated item to the persistent closet.

## Runtime Modes

Demo mode remains the default:

```bash
NEXT_PUBLIC_TRAVOGUE_MODE=demo
```

Real mode enables the Phase 4 pipeline:

```bash
NEXT_PUBLIC_TRAVOGUE_MODE=real
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_METADATA_MODEL=gpt-5.4
OPENAI_IMAGE_MODEL=gpt-image-1.5
```

Keys stay in `.env.local`; only `.env.example` is committed.

The upload page also includes an in-app **Dev** toggle. Dev mode is a browser-local override, not an environment value. It keeps the real-mode UI shape but reuses the latest cached real closet asset and skips OpenAI calls, so review/closet/mixer UI can be tested repeatedly without token spend.

## Fixed Phase 4 Identity

Until auth exists, all real data is written under:

- `household_id`: `demo-household`
- `profile_id`: `profile-aankur`

## Implemented Surface

- `POST /api/wardrobe/uploads`
- `GET /api/wardrobe/jobs/:jobId`
- `POST /api/wardrobe/jobs/:jobId/run`
- `GET /api/wardrobe/batches/:batchId`
- `GET /api/wardrobe/closet`
- `POST /api/wardrobe/dev/uploads`
- `POST /api/wardrobe/garments/:garmentId/add`
- `POST /api/wardrobe/garments/:garmentId/retry`

## Supabase

Migration:

```text
supabase/migrations/20260526000000_phase4_real_upload.sql
```

Creates private buckets:

- `source-images`
- `closet-assets`

Creates tables:

- `upload_batches`
- `source_images`
- `prettify_jobs`
- `detected_garments`
- `wardrobe_items`

The app uses the service-role key server-side only. Storage assets are rendered through signed URLs.

## OpenAI Pipeline

1. Metadata: Responses API returns strict JSON for category, name, confidence, and mixer readiness.
2. Prettify: Images Edit API generates a square PNG studio asset.
3. Validation: Responses API compares source and generated images.
4. Persistence: accepted or review-needed garments become detected garments for the existing review flow.

If OpenAI or Supabase fails, the job is marked `failed` and the processing UI exposes Retry.

Before any OpenAI call, uploaded source images are normalized to orientation-correct sRGB PNG. This prevents iPhone/Display P3 JPEGs from failing with invalid image mode errors while keeping the original source image stored in Supabase.

## Dev Cache Mode

Dev mode is intended for UI iteration after at least one real item has already been generated:

1. Tap **Dev** on `/upload`.
2. Choose any local file to exercise upload UI.
3. The app calls `POST /api/wardrobe/dev/uploads`.
4. The server creates a new review batch from the latest real closet item.
5. The flow goes directly to Review and does not call OpenAI.

Tap **Real** on `/upload` to return to the actual OpenAI pipeline.

## Review UX

The review card is optimized for approval decisions:

- Large framed product preview.
- Image constrained inside the frame with no text/action overlap.
- Brand prompt, confidence/category pills, delete, Retry, and Add controls stay visible below the image.
- Real signed URLs render through Next Image with `unoptimized`, because assets are private Supabase signed URLs.

## Out Of Scope

- Outfit-photo garment detection.
- Multi-item/batch upload.
- Transparent segmentation.
- Avatar try-on rendering.
- Auth and households.
- Background workers.
- Trip recommendation intelligence.

## Follow-Up Candidates

- Detect full outfit/person uploads in item mode and ask the user to switch flows.
- Add true outfit-photo decomposition with one review card per garment.
- Add source-vs-generated comparison or tap-to-zoom on review cards.
- Add cache lookup by normalized image hash, not only latest closet asset reuse in Dev mode.
