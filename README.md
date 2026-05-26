# Wearabouts

Wearabouts is a mobile-web-first wardrobe and travel packing app. It helps a household turn real clothing photos into clean closet assets, build trip-ready outfits, and remember what actually gets worn.

The core product bet is **Auto-Prettify**: messy wardrobe photos should become standardized, reviewable clothing assets that can power a closet, outfit boards, a swipable Closet Mixer, trip looks, packing lists, and eventually daily outfit recommendations.

## Current Build

Phase 0-1 is implemented:

- Next.js, React, and TypeScript app scaffold
- Demo runtime mode
- Wardrobe domain models
- Demo wardrobe ingestion provider
- Upload flow with Auto-Prettify explainer
- Detected item review flow
- Add, Retry, Delete, and Add All actions
- Closet page showing approved demo items

No real AI, Supabase, or network provider integration exists yet. The app currently uses demo fixtures so the product flow can be tested without AI spend.

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

