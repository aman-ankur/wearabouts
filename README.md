# Wearabouts

Wearabouts helps turn a real closet into outfits you can actually use.

Most packing apps start with lists. Wearabouts starts with the clothes: the shirt on the chair, the jacket in yesterday's photo, the shoes you always forget until the taxi is downstairs. The product goal is simple: make your wardrobe visible, make outfits easier to choose, and make travel packing feel less like a small domestic audit.

## What It Solves

Getting dressed for a trip has a few annoying steps:

- remembering what you own
- turning scattered clothing photos into a useful closet
- finding combinations that work together
- planning outfits by day, weather, and activity
- packing only what supports those outfits
- remembering what you actually wore

Wearabouts ties those steps together. Upload clothes, review the cleaned-up pieces, build looks, plan a trip, and let the packing list fall out of the outfits instead of starting from a blank checklist.

## Product Shape

The current product spine is:

1. **Auto-Prettify**: turn messy clothing photos into clean closet assets.
2. **Closet**: keep approved wardrobe items in one place.
3. **Closet Mixer**: browse outfit combinations quickly, without pretending every swipe is a perfect try-on.
4. **Stylist**: suggest closet-only looks for the day.
5. **Trip Looks**: plan what to wear day by day.
6. **Packing List**: derive what to pack from the approved looks.
7. **Avatar Studio**: render selected saved outfits when a higher-fidelity preview is worth the wait.

The app is travel-first, but the same closet memory can support daily outfit help later.

## Account Model

Wearabouts now has a real private account boundary.

- Visitors can explore a fixture-backed demo without signing in.
- Personal upload, wardrobe, avatar, and profile data require login.
- Login uses email codes, not passwords.
- A user's private space is called a **Circle**.
- The first release creates one Circle and one personal wardrobe profile.

Family sharing is intentionally not built yet. One good closet boundary first; party planning later.

## Current Build

The app currently supports:

- public entry screen and no-login demo
- email-code login and minimal onboarding
- profile/settings screen for name, style presentation, and sign out
- private real-mode wardrobe ownership by authenticated Circle/profile
- real upload and review flows backed by Supabase storage/tables
- outfit-photo decomposition into selectable review candidates
- cached dev upload mode for UI iteration without spending generation calls
- Closet Mixer, Stylist, Trip Looks, Packing List, and Avatar Studio slices

Older docs may still mention Travogue. The product name is **Wearabouts**.

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

For real private upload/profile testing, `.env.local` needs:

```bash
NEXT_PUBLIC_TRAVOGUE_MODE=real
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Before testing the account/profile branch on an existing Supabase project, apply the account/Circle migration in `supabase/migrations/20260529000000_account_circles_profiles.sql`. For shared databases that are still serving older deployed code, use the compatible ownership setup from the PR notes and defer strict storage-path constraints until this branch is deployed.

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
