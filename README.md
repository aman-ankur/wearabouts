<p align="center">
  <img src="docs/product/assets/wearabouts-mark.svg" alt="Wearabouts" width="96" />
</p>

# Wearabouts

Wearabouts is a private closet companion for the clothes people actually own: daily outfits, trips, packing, saved looks, and the occasional "wait, do I even have shoes for this?" moment.

It starts with real wardrobe photos. Upload a shirt, a full outfit, or the jacket hiding in yesterday's mirror selfie; Wearabouts turns the useful pieces into closet-ready assets, asks for review before saving, and then helps build looks from the wardrobe instead of from a shopping catalog.

The current app is built around one simple idea: make the closet visible enough that getting dressed feels less like rummaging and more like choosing.

## What Works Today

- A public no-login demo with fixture clothes, looks, packing, and avatar examples.
- Email-code login for a private real closet.
- Minimal onboarding for name and style presentation.
- Upload and review flows backed by Supabase storage and tables.
- Outfit-photo decomposition into selectable review candidates.
- Closet Mixer for fast outfit browsing and refinement.
- Stylist suggestions for closet-only daily looks.
- Trip Looks and Packing List flows for day-by-day planning.
- Avatar Studio for rendering selected saved outfits when a higher-fidelity preview is worth the wait.

Demo mode stays open and sample-backed. Personal upload, wardrobe, profile, avatar, and saved real data require login.

## Private Closets

Wearabouts now has a real account boundary, but the product language stays human.

A user's private space is a **Circle**. The first release creates one Circle and one personal wardrobe profile. That keeps today's experience simple while leaving room for partners, family, roommates, or shared travel groups later.

Family sharing is intentionally not built yet. One good closet boundary first; group logistics can wait their turn.

## Builder Notes

Older docs may still mention Travogue, the original working name. The product name is **Wearabouts**.

The main app is Next.js, TypeScript, and Supabase. Demo mode and real mode share UI contracts where possible; providers and data sources change underneath. For real private testing, `.env.local` needs:

```bash
NEXT_PUBLIC_TRAVOGUE_MODE=real
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Before testing account/profile ownership on an existing Supabase project, apply `supabase/migrations/20260529000000_account_circles_profiles.sql`. If the same database is still serving older deployed code, use the compatible rollout notes from the account/profile PR and delay stricter storage-path constraints until the deployed app has the matching routes.

## Documentation

Start here:

- [Project Context](docs/product/PROJECT_CONTEXT.md)
- [Account, Login, And Onboarding Design](docs/superpowers/specs/2026-05-29-account-login-onboarding-design.md)
- [Account Login Onboarding Foundation Plan](docs/superpowers/plans/2026-05-29-account-login-onboarding-foundation.md)
- [MVP Design Spec](docs/product/specs/2026-05-26-travogue-mvp-design.md)
- [UX Test Log](docs/testing/WEARABOUTS_UX_TEST_LOG.md)
- [Product Flow Mockups](docs/product/mockups/travogue-product-flows.html)

## Running Locally

Install dependencies:

```bash
npm install
```

Start the app on the project port:

```bash
npm run dev -- -p 3000
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
