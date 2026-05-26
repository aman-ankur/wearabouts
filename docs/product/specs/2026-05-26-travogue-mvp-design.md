# Travogue MVP Design

## Product Summary

Travogue is a mobile-web-first personal wardrobe and travel packing app for a household. It helps a user and their partner upload real wardrobe photos, turn messy photos into clean standardized closet assets, plan day-by-day trip outfits, and derive packing lists from those outfits.

The first product bet is not generic packing. The first product bet is whether Travogue can reliably turn real clothing photos into clean, mixer-ready wardrobe assets. If that works, the rest of the product becomes possible: closet browsing, outfit boards, avatar previews, trip looks, packing lists, and eventually daily outfit recommendations.

The product is inspired by the category of apps like Alta Daily, but it should differentiate through a travel-first workflow, personal wear memory, and an interactive Closet Mixer rather than only a daily suggestion feed.

## Target Users

- A household with multiple wardrobe profiles, initially the user and his wife.
- People who want practical packing help but still care about looking stylish.
- People who want a personal closet assistant that remembers what they wore, skipped, liked, and repeated.
- People who want to experiment with outfits visually without paying for expensive image generation on every interaction.

## MVP Goals

- Build a real MVP with demo mode baked in from the start.
- Support mobile web as the primary usage surface.
- Let users upload outfit photos and item photos.
- Auto-detect, prettify, and review wardrobe items before saving.
- Create a clean closet of standardized assets.
- Let users mix tops, bottoms, shoes, layers, and accessories in a fast visual preview.
- Create trip-specific, day-by-day outfit plans.
- Derive packing lists from approved looks.
- Capture wearing history after a trip or day.
- Support limited high-quality avatar renders only for selected outfits.

## Non-Goals For MVP

- Native mobile app.
- Live Instagram, Reddit, or Pinterest trend scraping.
- Shopping links or ecommerce recommendations.
- Fully autonomous wardrobe ingestion with no review.
- Perfect photoreal try-on for every swipe.
- Calendar or email itinerary import.
- Complex social sharing.
- Local-first privacy architecture.

## Core Product Spine

1. Auto-Prettify
2. Closet
3. Closet Mixer
4. Trip Looks
5. Packing List
6. Avatar Render
7. Wear Memory

## Differentiation

### Travel-First Instead Of Daily-First

The MVP should focus on trips. A user creates a trip with destination, dates, travelers, activities, luggage preference, style mode, and conversational notes. The main output is a day-by-day outfit plan by traveler and occasion.

Daily outfit recommendations are a later mode powered by the same engine.

### Auto-Prettify As The Core Engine

Auto-Prettify turns messy real-world clothing photos into clean, standardized assets. This unlocks the rest of the app.

### Closet Mixer

The Closet Mixer is the playful interaction: tops, bottoms, shoes, layers, and accessories can be swiped left and right in a fast visual preview. Users can lock one item, explore matches, save outfits, and assign outfits to trip days. The Phase 2 demo uses an honest outfit-board preview; real body/avatar try-on must wait until the app has a proper avatar-render pipeline.

### Personal Memory

The app should remember what the user wore, skipped, liked, rejected, repeated, and paired successfully. Future suggestions should use this memory.

## Household And Profiles

The MVP uses one household account with multiple wardrobe profiles.

Initial profile types:

- User
- Wife
- Shared

Future profile types may include children, guest, or shared travel gear.

Each profile stores:

- Display name
- Style preferences
- Hard style guardrails
- Comfort preferences
- Sizing notes
- Wardrobe items
- Wear history
- Optional avatar/body setup

## Wardrobe Capture

Users can upload:

- Outfit photos of themselves wearing clothes.
- Standalone item photos.
- Multiple photos in a batch.

After upload, the app creates a Detected Items Review screen. Each detected item appears as a review card with:

- Prettified image
- Proposed item name
- Editable brand field
- Proposed category
- Owner profile
- Source badge: outfit photo or item photo
- Optional confidence warning
- Retry action
- Add action
- Delete action
- Add All action for the batch

The app must not save detected items directly into the closet without review.

## Auto-Prettify

### Definition

Auto-Prettify is wardrobe asset normalization. It turns an uploaded clothing photo or detected garment crop into a clean, standardized closet asset.

### Required Output

Each prettified asset should be:

- Front-facing when possible
- Centered
- Straightened
- Consistently cropped
- Consistently padded
- Lit evenly
- Background removed or neutralized
- Stored as transparent PNG/WebP or a neutral-background image
- Recognizable as the original garment

### Quality Rule

The app may clean up the image, but it must preserve the actual item. It should not invent a different garment, materially change the color, remove important patterns, alter logos, change the silhouette, or hide meaningful details.

Guiding principle:

> Studio-clean representation of my real garment, not a fantasy version of it.

### Pipeline

Auto-Prettify should be implemented as a staged AI pipeline, not an autonomous agent.

1. Image intake quality check
   - Blur
   - Lighting
   - Occlusion
   - Garment visibility
   - One person/item where required

2. Garment detection
   - Find visible garments.
   - Propose category and boundaries.

3. Segmentation
   - Isolate garment.
   - Remove background.
   - Produce mask and cutout.

4. Classification and metadata
   - Name
   - Category
   - Color
   - Pattern
   - Material guess
   - Formality
   - Season
   - Occasion

5. Normalization
   - Straighten
   - Center
   - Crop
   - Resize
   - Normalize padding
   - Improve lighting

6. Generative repair, only when needed
   - Clean hanger shadows.
   - Fill small missing edges.
   - Reduce distracting folds.
   - Improve studio-like presentation.

7. Validation
   - Verify the output still matches the source item.
   - Verify category is plausible.
   - Verify color was not shifted materially.
   - Verify output is mixer-ready or mark it as needing review.

8. Human confirmation
   - Add
   - Retry
   - Edit
   - Delete
   - Add All

### Layered Outfits

For layered uploads, accuracy is more important than ambition.

- If separation is high confidence, save separate items.
- If separation is uncertain, save a combined look or combo item.
- The review screen must label layered outputs clearly.
- The app must not pretend to extract a clean garment if only a small visible portion exists.

Example:

- High confidence: save denim jacket and white T-shirt separately.
- Low confidence: save "Blue Denim Jacket + White T-shirt" as a combo look.

### Initial Supported Categories

Strong MVP support:

- Shirts
- T-shirts
- Sweaters
- Jackets
- Pants
- Jeans
- Shorts
- Shoes

Supported with lower confidence:

- Bags
- Scarves
- Watches
- Jewelry
- Layered looks
- Ethnic wear
- Draped clothing
- Complex patterned items

## Closet

The closet stores approved wardrobe items only.

Each wardrobe item should include:

- ID
- Owner profile
- Name
- Brand
- Category
- Subcategory
- Colors
- Pattern
- Material guess
- Formality
- Season
- Occasion tags
- Comfort tags
- Original photo references
- Detected crop
- Prettified asset
- Thumbnail
- Confidence metadata
- Created date
- Last worn date
- Wear count
- User feedback signals

## Closet Mixer

### Purpose

The Closet Mixer lets the user visually try combinations quickly without generating a new photoreal image for every swipe. The product should avoid fake body try-on previews when garments cannot be aligned credibly.

### Interaction

- Phase 2 demo: an outfit-board preview stays centered.
- Later body mode: the user's actual body photo or masked body base may stay centered only after body landmarks, garment scaling, occlusion, and quality checks exist.
- Tops swipe horizontally.
- Bottoms swipe horizontally.
- Shoes swipe horizontally.
- Layers and accessories appear as optional trays.
- User can lock any item.
- User can ask for intent-based changes.
- User can save a look.
- User can assign a look to a trip day.

Example prompts:

- More casual
- Better for rain
- More dinner-ready
- Less black
- More resort vibe
- Keep these pants, change the top

### Preview Modes

1. Outfit Board
   - Clean flat-lay composition.
   - Best for trip planning and packing review.
   - Required fallback whenever body/avatar fitting quality is not good enough.

2. Closet Mixer
   - Fast mixer surface with swipable item rails.
   - May use outfit board first; may use body in middle only when alignment is credible.
   - Best for exploration.

3. Avatar Render
   - High-quality generated preview.
   - Only for selected or saved outfits.

## Avatar

### MVP Avatar Setup

Users can optionally create an avatar by uploading:

- Face photo
- Full-body photo

The app validates:

- Face clarity
- Head-to-toe body visibility
- One person in frame
- Good lighting
- Minimal occlusion

### Two-Level Avatar Strategy

1. Instant Mixer Preview
   - Fast, modular, swipable.
   - Starts with outfit-board composition in demo mode.
   - Later may use the user's actual body photo or body mask only with credible fit/alignment handling.
   - Uses prettified clothing assets.
   - Does not require image generation per swipe.

2. High-Quality Avatar Render
   - Generated only when user chooses a selected outfit.
   - Used for polished preview.
   - Can later support location backdrops.

The MVP should not depend on photoreal rendering for the core flow.

## Trip Planning

### Trip Setup

Trip setup includes both structured fields and conversational input.

Structured fields:

- Destination
- Dates
- Travelers/profiles
- Activities
- Baggage mode
- Style mode
- Laundry access
- Special events

Conversational field:

- Free-text note such as "Goa for 4 days, lots of beach time, one nice dinner, do not overpack."

### Style Modes

- Minimal
- Balanced
- Style First
- Wildcard

Minimal prioritizes fewer items and more reuse.

Balanced is the default.

Style First prioritizes stronger looks and variety.

Wildcard adds trend-aware inspiration while respecting hard personal guardrails.

## Recommendation Intelligence

The recommendation engine combines:

1. Trip context
   - Destination
   - Weather
   - Dates
   - Activities
   - Events
   - Luggage mode
   - Laundry access

2. Wardrobe facts
   - Category
   - Color
   - Material
   - Pattern
   - Formality
   - Season
   - Comfort

3. Personal memory
   - Worn
   - Skipped
   - Liked
   - Rejected
   - Repeated
   - Successful pairings

4. Style profile
   - Practical preferences
   - Aesthetic preferences
   - Hard "never suggest" rules
   - Boldness level

5. Trend layer
   - Curated trend packs
   - User-provided inspiration links or screenshots

### Ranking Priority

1. Weather/activity correctness and style quality are tied first.
2. User control and personalization come next.
3. Wardrobe efficiency matters, especially in Minimal mode, but should not make outfits boring.

## Trip Looks

The primary trip output is day-by-day looks, not a generic packing list.

Each trip day may include:

- Travel outfit
- Daytime outfit
- Evening outfit
- Special-event outfit

Each look shows:

- Outfit board
- Items used
- Weather/activity rationale
- Style rationale
- Repetition warnings
- Swap controls
- Save/approve state

Users can edit by:

- Tapping an item and choosing a swap.
- Using stylist chat.
- Locking one item and regenerating compatible pieces.

## Packing List

The packing list is derived from approved trip looks.

Primary focus:

- Clothes
- Shoes
- Accessories
- Bags

Secondary checklist templates:

- Toiletries
- Electronics
- Documents
- Medicines
- Chargers
- Travel gear

The essentials list should be useful but should not crowd the clothing/outfit intelligence.

## Wearing History

Users can log wearing history through:

- Manual check-in
- Planned outfit marked as worn, skipped, or changed
- Optional outfit diary photo upload

Wear history powers future recommendations.

## Trend Layer

V1 should use:

- Curated trend packs
- User-provided screenshots or links as inspiration inputs

V1 should not include live trend scraping from Instagram, Reddit, or Pinterest.

Trend suggestions must respect hard guardrails. For example, if the user will not wear neon pants, Wildcard mode must not suggest neon pants.

## Demo Mode

Demo mode is a first-class runtime mode, not a throwaway prototype.

Demo mode uses the same UI and internal data contracts as real mode. Only providers change.

Example provider pairs:

- DemoWardrobeExtractionProvider / AIWardrobeExtractionProvider
- DemoPrettifyProvider / AIPrettifyProvider
- DemoRecommendationProvider / AIRecommendationProvider
- DemoAvatarProvider / AIAvatarProvider

Demo fixtures should include:

- Upload batches
- Raw photo references
- Detected garments
- Prettified assets
- Review cards
- Closet items
- Mixer combinations
- Trip looks
- Packing lists
- Demo avatar render sample assets

## Technical Architecture

### Recommended MVP Stack

- Next.js
- React
- TypeScript
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Server routes or server actions for backend logic
- Provider interfaces for AI/prettify services

This stack is recommended because it is fast for a real MVP and keeps the architecture close to a deployable product.

### Alternative Stack

If more backend control is desired from day one:

- Vite React frontend
- FastAPI or NestJS backend
- Postgres
- S3-compatible storage
- Worker queue

This is cleaner for heavy AI orchestration but slower to build.

### Backend Services

- UploadService
- PrettifyJobService
- WardrobeService
- ClosetAssetService
- TripService
- RecommendationService
- MemoryService
- AvatarService
- DemoModeService

### Data Objects

- Household
- WardrobeProfile
- UploadBatch
- SourceImage
- DetectedGarment
- ClosetAsset
- WardrobeItem
- Outfit
- Trip
- TripDayLook
- PackingList
- WearLog
- AvatarProfile
- AIJob

## AI Strategy

### Provider Cascade

Use cheaper models for:

- Photo quality checks
- Metadata extraction
- Trip note parsing
- Outfit explanations
- Packing list generation
- Recommendation drafts

Use stronger or specialized models for:

- Garment detection
- Segmentation
- Prettify generation
- Output validation
- Difficult layered outfits

Use expensive image generation only when it materially improves the closet asset or when the user explicitly requests a high-quality avatar render.

### Agents

Auto-Prettify should not be implemented as an autonomous agent in the MVP. It should be a staged job pipeline with model calls, validation gates, retries, caching, and structured outputs.

Agent-like behavior may be useful later for:

- Conversational trip revisions
- Wardrobe audits
- Style analysis
- Trend interpretation
- Packing tradeoff explanations

## Reliability And Trust

The app must be confidence-aware.

- High confidence: ready to add
- Medium confidence: needs review
- Low confidence: ask for a better photo or save as combo/look only

The app should say what it can reliably see. It must not hide uncertainty.

## Evaluation Set

Create an internal image test set early:

- 20 tops
- 10 bottoms
- 10 outerwear
- 10 shoes/accessories
- 10 layered outfits
- Mixed lighting/background examples

Every provider should be evaluated against this set before becoming the default.

## MVP Success Criteria

- Uploaded garments become visually consistent enough to browse and mix.
- Users can approve detected items without frustration.
- Closet Mixer feels fun and fast, even if not perfectly realistic.
- Trip plans produce weather/activity-appropriate outfits that are stylish, not boring.
- Packing lists are clearly derived from approved looks.
- Demo mode exercises the full flow without AI spend.
- AI uncertainty is surfaced honestly.

## Phased Implementation Plan

This section is intentionally phased so LLM coding tools can build the MVP safely in small, verifiable increments.

### Phase 0: Project Foundation

Goal: Create the app shell and core contracts without AI complexity.

Build:

- Next.js React TypeScript app
- Mobile-first layout shell
- Routing
- Basic design system
- Supabase project wiring stubs with documented environment variables
- Runtime mode flag: demo or real
- Core TypeScript domain types
- Provider interfaces

Verify:

- App runs locally.
- Demo mode flag is visible in development.
- Domain types compile.
- No real AI calls exist yet.

### Phase 1: Demo Upload And Review Flow

Goal: Prove the wardrobe ingestion UX with fixtures.

Build:

- Upload batch screen
- Demo upload provider
- Detected Items Review screen
- Review cards
- Add, Retry, Delete, Add All interactions
- Demo detected garments and prettified assets
- Save approved demo items into local or mock persistence

Verify:

- User can move from upload to review to closet with no AI calls.
- Review card states work.
- Add All works.
- Retry can return an alternate fixture.

### Phase 2: Closet And Closet Mixer Demo

Goal: Prove the "Lego wardrobe" interaction using standardized assets.

Build:

- Closet screen
- Wardrobe item detail
- Mixer screen
- Demo outfit-board preview
- Horizontal swipe rows for tops, bottoms, shoes, layers, accessories
- Lock item interaction
- Save outfit interaction

Verify:

- Mixer is smooth on mobile viewport.
- User can swipe categories independently.
- User can lock one item and change another.
- Saved outfits persist in demo mode.

### Phase 3: Trip Planning Demo

Goal: Prove the travel-first product flow.

Build:

- Trip setup form
- Conversational trip note field
- Style mode selector
- Traveler/profile selector
- Demo recommendation provider
- Trip Looks screen
- Outfit swap from fixture alternatives
- Derived packing list

Verify:

- User can create a trip.
- Demo provider returns day-by-day looks.
- Swapping an item updates the look.
- Packing list updates from approved looks.

### Phase 4: Real Storage And Auth

Goal: Replace mock persistence with real user data storage.

Build:

- Supabase auth
- Household/profile schema
- Upload batch schema
- Wardrobe item schema
- Closet asset schema
- Trip schema
- Outfit schema
- Packing list schema
- Storage buckets for original and prettified assets

Verify:

- User can sign in.
- Data is scoped to household/profile.
- Images upload to storage.
- Approved items persist after refresh.

### Phase 5: Real Auto-Prettify Alpha

Goal: Integrate the first real AI pipeline behind the existing provider interface.

Build:

- Real upload service
- AI job records
- Image quality check
- Initial garment detection provider
- Initial segmentation provider
- Initial metadata extraction provider
- Initial prettify provider
- Validation result object
- Retry path

Verify:

- Real mode can process a small image batch.
- Outputs appear in the same review UI as demo mode.
- Failed or low-confidence jobs do not break the flow.
- Outputs are cached.

### Phase 6: Auto-Prettify Quality Iteration

Goal: Improve output quality before adding more product surface.

Build:

- Evaluation set runner
- Provider comparison hooks
- Confidence scoring improvements
- Duplicate detection v1
- Better layered outfit handling
- Category-specific crop rules

Verify:

- Evaluation outputs are reviewed consistently.
- Top MVP categories meet quality bar.
- Layered outputs are labeled accurately.

### Phase 7: Recommendation Real Mode

Goal: Replace demo recommendations with real trip and wardrobe reasoning.

Build:

- Rule-based weather/activity constraints
- LLM-assisted outfit planning
- Hard style guardrails
- Personal preference handling
- Explanation generation
- Packing list derivation from approved looks

Verify:

- Recommendations respect hard guardrails.
- Weather/activity mismatches are caught.
- Packing list changes when outfits change.

### Phase 8: Avatar Setup And Render

Goal: Add the optional wow moment after core wardrobe and trip planning work.

Build:

- Face photo upload
- Body photo upload
- Validation guidance
- Avatar profile storage
- Mixer body-base integration
- High-quality render provider interface
- Demo avatar render
- Real avatar render provider alpha

Verify:

- Mixer works without avatar render.
- Avatar render is explicit and cached.
- Failed render does not block trip planning.

### Phase 9: Wear Memory

Goal: Close the feedback loop.

Build:

- Mark outfit as worn, skipped, or changed
- Outfit diary photo upload
- Wear log model
- Last worn and wear count updates
- Recommendation signals from wear history

Verify:

- Wear history affects future suggestions.
- User can correct planned versus actual outfits.

## Implementation Guardrails For LLM Coding Tools

- Do not build real AI providers before demo providers.
- Do not build avatar rendering before Closet Mixer.
- Do not build trip recommendations before wardrobe item contracts exist.
- Keep demo and real providers behind the same interfaces.
- Keep each phase shippable and testable.
- Prefer typed domain objects over ad hoc JSON blobs.
- Add tests around provider contracts and packing-list derivation early.
- Avoid styling-heavy rewrites while building backend contracts.
- Never let low-confidence AI output auto-save to the closet.
