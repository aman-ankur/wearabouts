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

## Out Of Scope

- Outfit-photo garment detection.
- Multi-item/batch upload.
- Transparent segmentation.
- Avatar try-on rendering.
- Auth and households.
- Background workers.
- Trip recommendation intelligence.
