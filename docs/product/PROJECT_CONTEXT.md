# Wearabouts Project Context

Read this file first in any new chat or coding session. It compresses the product decisions, design direction, technical strategy, and implementation boundaries discussed so far.

## Where The Important Files Are

- Product PRD and technical spec: `docs/product/specs/2026-05-26-travogue-mvp-design.md`
- Static product flow mockups: `docs/product/mockups/travogue-product-flows.html`
- HTML mockup implementation plan: `docs/product/plans/2026-05-26-travogue-html-flow-mockups.md`
- Phase 0-1 implementation plan: `docs/product/plans/2026-05-26-phase-0-1-foundation-upload-review.md`
- Phase 2 Closet Mixer implementation plan: `docs/product/plans/2026-05-26-phase-2-closet-mixer-demo.md`
- Phase 6 Smart Mixer design: `docs/superpowers/specs/2026-05-27-phase6-smart-mixer-outfit-engine-design.md`
- Phase 6 Smart Mixer implementation handoff: `docs/product/plans/2026-05-27-phase-6-smart-mixer-outfit-engine.md`
- Account, login, and onboarding design: `docs/superpowers/specs/2026-05-29-account-login-onboarding-design.md`
- Account foundation implementation plan: `docs/superpowers/plans/2026-05-29-account-login-onboarding-foundation.md`

Open the HTML file directly in a browser. No dev server is needed for the mockup.

## Product One-Liner

Wearabouts is a mobile-web-first personal wardrobe and travel packing app. It turns real wardrobe photos into clean standardized closet assets, helps users mix outfits visually, plans day-by-day trip looks, derives packing lists, and remembers what people actually wore.

The project was originally discussed under the working name Travogue. Current product name: **Wearabouts**.

## Core Product Bet

The first technical and product bet is Auto-Prettify:

> Can Wearabouts turn messy real-world clothing photos into clean, standardized, closet-ready assets that are good enough for browsing, outfit boards, swiping, mixing, and trip planning?

If Auto-Prettify works, the rest of the product becomes much more achievable.

## Inspiration And Differentiation

The product is inspired by the category of apps like Alta Daily, especially:

- Clean wardrobe item normalization after upload.
- Daily/trip look suggestion feeds.
- Avatar setup using face and full-body photos.
- Final outfit rendering on an avatar.

Wearabouts should not copy Alta exactly. The differentiation is:

- Travel-first rather than daily-first in the MVP.
- Circle/profile ownership that starts personal and can later support partners, family, or shared travel groups.
- Auto-Prettify as the core engine.
- Closet Mixer as a playful central interaction.
- Trip Looks as the primary output.
- Packing list derived from approved looks.
- Personal memory from worn/skipped/changed outfits.
- Demo mode baked in for testing without AI spend.

## MVP Spine

The product spine is:

1. Auto-Prettify
2. Closet
3. Closet Mixer
4. Trip Looks
5. Packing List
6. Avatar Render
7. Wear Memory

## Target Users

- A person or Circle with one or more wardrobe profiles.
- People who want help packing for short local trips and longer vacations.
- People who care about style and trend relevance, but still need weather/activity correctness.
- People who want a personal wardrobe assistant that remembers past outfits and preferences.

## Important Product Decisions

### First Version Focus

The MVP focuses on:

- Trip packing and day-by-day outfit planning.
- Wardrobe digitization through photo upload.
- Auto-Prettify and detected item review.
- Closet Mixer.
- Demo mode.

Daily "what should I wear today?" is a later mode powered by the same engine.

### Account And Circle Model

The current product language is **Circle**, not household. A Circle is the private space that owns wardrobe, avatar, upload, and later trip data. It can represent a solo user, partners, family, roommates, or a shared travel group.

Current account slice:

- Public `/demo` remains fixture-backed and requires no login.
- Email-code login gates personal upload, private wardrobe mutations, avatar setup, and real saved data.
- Onboarding creates one Circle and one personal wardrobe profile.
- Private real-mode API routes resolve Circle/profile from the Supabase access token.
- New real assets are stored under `circleId/profileId/assetId.ext`.
- Family sharing and invites are intentionally deferred.

### Wardrobe Capture

Support both:

- Outfit photos of a person wearing clothing.
- Standalone item photos.

For MVP, detected items must go through user review before entering the closet.

### Auto-Prettify

Whenever a user uploads a clothing image, the app should offer or automatically run Auto-Prettify.

Auto-Prettify should:

- Detect garments.
- Segment clothing from background.
- Normalize crop, padding, centering, orientation, and lighting.
- Produce consistent clean closet assets.
- Preserve the real garment's color, pattern, silhouette, and important details.
- Avoid inventing a fantasy version of the item.

Guiding principle:

> Studio-clean representation of my real garment, not a fantasy version of it.

### Detected Items Review

After upload, show a review screen similar in spirit to the attached Alta screenshots:

- Clean/prettified item thumbnail.
- Proposed name.
- Editable brand.
- Category.
- Owner profile.
- Retry.
- Add.
- Delete.
- Add All.

Improve on the reference by adding:

- Source badge: outfit photo or item photo.
- Confidence/needs-review state when useful.
- Auto-Prettify status.
- Duplicate detection later.
- "Ready for mixer" status when asset quality is good enough.

### Layered Outfits

If the user uploads a layered outfit, use accuracy-first extraction:

- Save separate items only when confidence is high.
- Save a combined look/combo item when separation is uncertain.
- Clearly label layered outputs.
- Never pretend to extract a clean garment from a tiny visible portion.

Example:

- High confidence: save denim jacket and white T-shirt separately.
- Low confidence: save "Blue Denim Jacket + White T-shirt" as a combo look.

### Closet Mixer

The Closet Mixer should be one of the signature product moments.

Interaction:

- In Phase 6, Mixer opens with complete outfit suggestions from real/demo closet items.
- The center preview is an outfit board, not a body try-on.
- The user browses ranked looks with `Look X of N`, dots, and Previous/Next controls.
- Each suggestion includes title, intent, confidence, score, rationale, item names, and actions.
- User can save a look.
- User can reject a look with `Not this`.
- User can ask for nearby combinations with `More like this`.
- User can open `Refine`, lock slots, swap ranked alternatives, and save the refined look.
- Later phases can add natural-language changes like "more casual", "better for rain", "less formal", "keep these pants".

This is intentionally not full photoreal try-on for every swipe. It should feel fast, playful, and useful. Do not fake body try-on with poorly aligned overlays; if body/avatar preview quality is not available, use an honest outfit-board composition.

Current Phase 6 technical direction:

- Reusable outfit engine modules live under `src/features/wardrobe/outfits/`.
- Deterministic scoring is the source of truth for the first slice.
- Required outfit slots are top or outerwear plus bottom.
- Shoes, layers, and accessories are optional.
- `Not this` and `More like this` are currently session-local controls; persistent feedback is a next-phase task.
- Same-image upload caching is not complete yet. Ready jobs/candidates are idempotent, but a newly uploaded identical photo may still spend AI tokens in real mode until source-image hash caching is added.

### Avatar Strategy

Use a two-level avatar strategy:

1. Instant Mixer Preview
   - Fast and modular.
   - Starts as an outfit-board composition in demo mode.
   - Later may use the user's real body photo or body mask, but only with body landmarks, scale fitting, occlusion handling, and quality checks.
   - Uses prettified clothing assets.
   - Does not generate a new image per swipe.

2. High-Quality Avatar Render
   - Optional and explicit.
   - Generated only for selected/saved outfits.
   - Cached.
   - Later can support travel location backdrops.

Avatar setup asks for:

- Face photo.
- Full-body photo.

In real mode, avatar reference photos are media assets, not API JSON:

- The browser requests a signed upload slot from Wearabouts.
- The original face/body file uploads directly to the private Supabase `avatar-assets` bucket.
- The avatar profile API stores only asset IDs, storage paths, content types, and quality checks.
- Profile responses must stay metadata-only; do not return base64 image data or signed reference URLs to the browser.
- Avatar rendering resolves short-lived signed reference URLs server-side before calling the image provider.

Validate:

- Face clear.
- Head-to-toe body visible.
- One person in frame.
- Good lighting.
- Minimal occlusion.

### Trip Planning

Trip setup should combine structured fields with a conversational note.

Structured fields:

- Destination.
- Dates.
- Travelers/profiles.
- Activities.
- Baggage mode.
- Style mode.
- Laundry access.
- Special events.

Conversational note example:

> Goa for 4 days, lots of beach time, one nice dinner, do not overpack.

Primary output:

- Day-by-day Trip Looks.

Packing list is derived from approved looks.

### Recommendation Modes

Support all modes on demand:

- Minimal: fewer items, more reuse, carry-on friendly.
- Balanced: default, useful variety without overpacking.
- Style First: stronger looks and more variety.
- Wildcard: trend-aware but filtered through personal taste and hard guardrails.

### Recommendation Priorities

Ranking priority:

1. Weather/activity correctness and style quality tied first.
2. User control and personalization next.
3. Wardrobe efficiency matters, especially in Minimal mode, but should not make outfits boring.

### Personal Style

Use all of:

- Practical preferences: comfort, climate tolerance, laundry, repeat tolerance, formality.
- Fashion/style preferences: minimal, streetwear, classic, resort, smart casual, etc.
- Memory-based style: what the user wore, liked, rejected, skipped, repeated.
- Trend-aware suggestions from curated packs and user-provided inspiration.
- Hard guardrails such as "never suggest neon pants".

### Trend Layer

V1 should use:

- Curated trend packs.
- User-provided inspiration links/screenshots.

V1 should not use live Instagram/Reddit/Pinterest scraping.

### Wearing History

Support:

- Manual check-in.
- Mark planned outfit as worn, skipped, or changed.
- Optional outfit diary photo upload.

Wear history should affect future recommendations.

### Missing Items

V1 supports missing item suggestions only, not shopping links.

Example:

- "You lack one light rain layer for this trip."
- "One more neutral bottom would reduce repeats."

## Technical Direction

Recommended MVP stack:

- React.
- Next.js.
- TypeScript.
- Supabase Auth.
- Supabase Postgres.
- Supabase Storage.
- Server routes or server actions for backend logic.
- Provider interfaces for AI and demo mode.

Large user media should not be tunneled through serverless JSON payloads. Use direct storage uploads for original photos, then send small asset references through API routes. This avoids Vercel function payload limits and preserves source image quality for downstream normalization.

Alternative if more backend control is desired:

- Vite React frontend.
- FastAPI or NestJS backend.
- Postgres.
- S3-compatible storage.
- Worker queue.

The recommended path is still Next.js + Supabase because the goal is a real MVP with fast iteration.

## Demo Mode

Demo mode is first-class, not a throwaway prototype.

Demo mode and real mode must share the same UI and data contracts. Only providers change.

Provider pairs:

- DemoWardrobeExtractionProvider / AIWardrobeExtractionProvider
- DemoPrettifyProvider / AIPrettifyProvider
- DemoRecommendationProvider / AIRecommendationProvider
- DemoAvatarProvider / AIAvatarProvider

Demo mode should include fixture data for:

- Upload batches.
- Raw photo references.
- Detected garments.
- Prettified assets.
- Review cards.
- Closet items.
- Mixer combinations.
- Trip looks.
- Packing lists.
- Avatar render sample assets.

## AI Strategy

Do not build Auto-Prettify as an autonomous AI agent in the MVP.

Auto-Prettify should be a staged pipeline:

1. Image intake quality check.
2. Garment detection.
3. Segmentation.
4. Classification and metadata.
5. Normalization.
6. Generative repair only when needed.
7. Validation.
8. Human confirmation.

Use cheaper/faster models for:

- Photo quality checks.
- Metadata extraction.
- Trip note parsing.
- Outfit explanations.
- Packing list generation.
- Recommendation drafts.

Use stronger or specialized models for:

- Garment detection.
- Segmentation.
- Prettify generation.
- Output validation.
- Difficult layered outfits.

Use expensive image generation only when:

- It materially improves the closet asset.
- The user explicitly requests a high-quality avatar render.

Do not rely on cheap models alone for precise visual extraction. They may be useful for text reasoning, metadata, and drafts, but wardrobe trust depends on accuracy.

## Phase 8 Avatar Studio Notes

- Avatar Studio belongs after saved looks, not inside Mixer or Stylist browsing.
- Face and body avatar references are saved once in real mode via signed direct upload to private Supabase Storage and reused until the user chooses to update photos.
- Successful real avatar renders are saved automatically to Supabase and keyed by avatar profile, saved outfit, sorted wardrobe items, pose, quality, and prompt version.
- Reopening the same saved look checks the avatar render cache before calling OpenAI.
- Regenerate is explicit, limited, and intentionally bypasses cache.
- Deleted avatar renders are soft-deleted so they can still be reviewed later.
- The outfit-board fallback is a flat-lay item board with non-overlapping zones, not a body try-on or CSS garment overlay.

## Reliability Policy

The app must be confidence-aware:

- High confidence: ready to add.
- Medium confidence: needs review.
- Low confidence: ask for better photo or save as combo/look only.

The app should say what it can reliably see. It should not hide uncertainty.

## Evaluation Set

Create an internal test set early:

- 20 tops.
- 10 bottoms.
- 10 outerwear.
- 10 shoes/accessories.
- 10 layered outfits.
- Mixed lighting/background examples.

Every provider should be evaluated against this set before becoming the default.

## MVP Phases

The PRD includes a phased implementation plan so coding agents do not try to build everything at once.

High-level phases:

1. Project foundation.
2. Demo upload and review flow.
3. Closet and Closet Mixer demo.
4. Trip planning demo.
5. Real storage and auth.
6. Real Auto-Prettify alpha.
7. Auto-Prettify quality iteration.
8. Real recommendation mode.
9. Avatar setup and render.
10. Wear memory.

Important guardrails:

- Do not build real AI providers before demo providers.
- Do not build avatar rendering before Closet Mixer.
- Do not build trip recommendations before wardrobe item contracts exist.
- Keep demo and real providers behind the same interfaces.
- Keep each phase shippable and testable.
- Prefer typed domain objects over ad hoc JSON blobs.
- Never let low-confidence AI output auto-save to the closet.

## Visual Direction

The desired aesthetic is clean, modern, quiet, and mobile-web-first.

Design references from the discussion:

- Alta-like clean item review and outfit feed.
- Mostly black, white, grey, and soft neutrals.
- Garment colors should provide most of the visual accent.
- Avoid copying exact layouts, branding, or interaction details.
- Product should feel polished and practical, not like a marketing landing page.

The current static mockup file shows the first visual direction:

- `docs/product/mockups/travogue-product-flows.html`

## What To Build Next

Recommended next step:

1. Create a detailed implementation plan for Phase 0 and Phase 1 only.
2. Scaffold the Next.js/React/TypeScript app.
3. Implement domain types and provider interfaces.
4. Build demo upload -> Auto-Prettify explanation -> Detected Items Review -> Closet flow with fixtures.

Do not start real AI provider integration until the demo upload/review/closet flow feels right.

## Next Chat Handoff

Recommended next chat prompt:

```text
Please read AGENTS.md, docs/product/PROJECT_CONTEXT.md, and docs/product/plans/2026-05-26-phase-2-closet-mixer-demo.md, then implement Phase 2 on a new codex/phase-2-closet-mixer branch.
```

Phase 2 should build the demo Closet Mixer only. Keep it demo-mode and client-side: outfit-board preview, swipable item rails, lock/unlock slots, save outfit, and saved looks in closet. Do not start Supabase, real AI, real body upload, or avatar generation in Phase 2.
