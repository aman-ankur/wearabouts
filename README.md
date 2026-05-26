# Wearabouts

Wearabouts is a mobile-web-first wardrobe and travel packing app. It helps a household turn real clothing photos into clean closet assets, build trip-ready outfits, and remember what actually gets worn.

The core product bet is **Auto-Prettify**: messy wardrobe photos should become standardized, reviewable clothing assets that can power a closet, outfit boards, a swipable Closet Mixer, trip looks, packing lists, and eventually daily outfit recommendations.

## Current Build

Phase 0-5 foundation is implemented:

- Next.js, React, and TypeScript app scaffold
- Demo runtime mode for no-cost product flow testing
- Real runtime mode for single-item upload through Supabase and OpenAI
- In-app Dev mode toggle on Upload for cached no-OpenAI UI iteration
- Real outfit-photo decomposition foundation with one review card per generated garment
- Wardrobe domain models
- Demo wardrobe ingestion provider
- Upload flow with Auto-Prettify explainer
- Detected item review flow
- Add, Retry, Delete, and Add All actions
- Closet page showing approved demo and real items
- Closet Mixer demo with saved looks
- Trip looks demo with packing list
- Supabase-backed Phase 4 proof for one standalone item photo
- Supabase-backed Phase 5 proof for one outfit/person photo with multiple garment candidates
- OpenAI metadata, neutral studio asset generation, and validation pipeline
- Source image normalization before OpenAI calls for iPhone/Display P3 compatibility

Phase 5 real mode adds outfit-photo decomposition while keeping Phase 4 standalone item upload intact. Auth, avatar try-on, transparent segmentation, multi-photo batch upload, and production queues are still future phases.

## Product Direction

Wearabouts is travel-first:

1. Upload wardrobe photos.
2. Auto-Prettify detected clothes into clean assets.
3. Review and approve items into the closet.
4. Mix outfits visually.
5. Plan trip looks day by day.
6. Generate a packing list from approved outfits.
7. Log what was worn, skipped, or changed.

Daily "what should I wear today?" recommendations are planned as a later mode powered by the same wardrobe and memory engine.

## Documentation

Start here for full context:

- [Project Context](docs/product/PROJECT_CONTEXT.md)
- [MVP Design Spec](docs/product/specs/2026-05-26-travogue-mvp-design.md)
- [Phase 0-1 Implementation Plan](docs/product/plans/2026-05-26-phase-0-1-foundation-upload-review.md)
- [Phase 2 Closet Mixer Demo Plan](docs/product/plans/2026-05-26-phase-2-closet-mixer-demo.md)
- [Phase 3 Trip Looks Demo Plan](docs/product/plans/2026-05-26-phase-3-trip-looks-demo.md)
- [Phase 4 Real Upload + Auto-Prettify Foundation Plan](docs/product/plans/2026-05-26-phase-4-real-upload-prettify-foundation.md)
- [Phase 5 Real Outfit Photo Decomposition Plan](docs/product/plans/2026-05-26-phase-5-real-outfit-photo-decomposition.md)
- [UX Test Log](docs/testing/WEARABOUTS_UX_TEST_LOG.md)
- [Product Flow Mockups](docs/product/mockups/travogue-product-flows.html)

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Real upload mode needs local secrets in `.env.local`:

```bash
NEXT_PUBLIC_TRAVOGUE_MODE=real
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_METADATA_MODEL=gpt-5.4
OPENAI_IMAGE_MODEL=gpt-image-1.5
```

Apply the Supabase migrations before testing real upload:

```text
supabase/migrations/20260526000000_phase4_real_upload.sql
supabase/migrations/20260526001000_phase5_outfit_decomposition.sql
```

To test UI changes without spending OpenAI tokens, use the **Dev** button on `/upload`. Item photo reuses the latest cached real closet asset; Outfit photo creates a multi-card review batch from recent cached closet assets.

Run checks:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Git Notes

This repo should use the personal Git identity:

```bash
git config user.name "aman-ankur"
git config user.email "amanankur1110@gmail.com"
```

See [AGENTS.md](AGENTS.md) for coding-agent instructions.
