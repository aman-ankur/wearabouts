# Wearabouts UX Test Log

This is the living test log for hands-on Wearabouts UX/UI checks. Add a new dated entry whenever the app is manually tested, and store supporting screenshots under `testing/screenshots/`.

## 2026-05-26 - Phase 2 Demo UX Pass

### Environment

- Branch: `codex/phase-2-closet-mixer`
- Local URL: `http://127.0.0.1:3000`
- Surface: desktop Chrome viewing the mobile web app frame
- Scope: demo-only Phase 0-2 flow

### Flow Tested

1. Home page opens.
2. Add clothes opens `/upload`.
3. Batch upload creates the demo review batch.
4. Review screen shows six detected garments.
5. Add All saves all six garments to Closet.
6. Closet shows approved items.
7. Mixer opens from bottom nav.
8. Mixer renders outfit-board preview, rails, and lock controls.
9. Selecting a different top updates the stage and rail selection.
10. Locking the top disables top rail selection.
11. Saving creates a saved look.
12. Closet shows the saved look.

### Screenshots

- [Home](../../testing/screenshots/wearabouts-ux-home.png)
- [Upload choices](../../testing/screenshots/wearabouts-ux-upload.png)
- [Review screen](../../testing/screenshots/wearabouts-ux-review-top.png)
- [Closet](../../testing/screenshots/wearabouts-ux-closet-top.png)
- [Mixer](../../testing/screenshots/wearabouts-ux-mixer-top.png)
- [Mixer locked top](../../testing/screenshots/wearabouts-ux-mixer-locked.png)
- [Saved look in closet](../../testing/screenshots/wearabouts-ux-saved-look-full.png)

### Findings Fixed In This Pass

- Updated user-facing app name from Travogue to Wearabouts in app metadata and home UI.
- Updated Auto-Prettify explainer copy to say Wearabouts.
- Allowed long detected garment names to wrap instead of truncating too aggressively.
- Changed Closet filter pills into working filter buttons.
- Added mixer save confirmation text after saving a look.
- Shortened the accessory lock label to avoid clipping in the compact mixer lock row.
- Added a direct-load note to the Mixer empty state because demo state is client-side and resets on reload.
- Replaced the fake human try-on preview with an outfit-board preview so the demo does not imply real avatar fitting.

### Remaining Notes

- Demo state is still in-memory only by design for Phase 2.
- Closet filters are simple category filters; no persisted filter state yet.
- Saved looks are summary rows only; they do not render outfit thumbnails yet.
- Real body/avatar try-on quality is not represented by this Phase 2 demo. It needs a separate avatar-render pipeline with body landmarks, garment segmentation, fit/occlusion handling, and quality checks.

## 2026-05-26 - Phase 3 Trip Looks Demo UX Pass

### Environment

- Branch: `codex/phase-3-trip-looks-demo`
- Local URL: `http://localhost:3000`
- Surface: mobile viewport in temporary headless Chrome
- Scope: demo-only Phase 3 trip outfit planning

### Flow Tested

1. Opened `/trips` with an empty in-memory closet.
2. Confirmed Trips shows the closet-needed empty state and links to Add demo items.
3. Opened `/upload`, selected Batch upload, and added all six demo garments.
4. Opened Trips through the bottom nav so the client-side demo state stayed intact.
5. Started the Goa demo trip.
6. Confirmed three day-by-day suggested looks render from closet items.
7. Swapped one look and confirmed the packing list changed to include the alternate top.
8. Approved one look and confirmed the trip header moved to `1/3 approved`.
9. Confirmed the derived packing list deduplicates items and shows wear counts.

### Screenshots

- [Trips empty state](../../testing/screenshots/wearabouts-ux-trips-empty.png)
- [Trips start state](../../testing/screenshots/wearabouts-ux-trips-start.png)
- [Generated trip looks](../../testing/screenshots/wearabouts-ux-trip-looks.png)
- [Packing list after swap and approve](../../testing/screenshots/wearabouts-ux-packing-list.png)

### Assets And Scripts

- Screenshot capture helper: `testing/scripts/capture-trip-flow.mjs`
- New screenshots:
  - `testing/screenshots/wearabouts-ux-trips-empty.png`
  - `testing/screenshots/wearabouts-ux-trips-start.png`
  - `testing/screenshots/wearabouts-ux-trip-looks.png`
  - `testing/screenshots/wearabouts-ux-packing-list.png`

### Findings Fixed In This Pass

- Added a Trips tab to bottom nav with five equal columns.
- Added the `/trips` demo flow with a start screen, day look cards, approve/swap actions, and packing list.
- Added a deterministic demo swap selector so Swap changes an unlocked outfit slot without calling any provider.
- Tightened trip look miniature layout so closet item artwork no longer clips at the card edges.
- Updated the screenshot script to follow in-app navigation after Add All because hard reloads reset the intentionally client-side demo state.

### Remaining Notes

- Phase 3 remains demo-mode and in-memory only; a hard browser reload resets closet, saved outfits, and trips.
- Trip looks use deterministic fixture/selector logic, not AI recommendations.
- There is still no Supabase, auth, real upload, weather, itinerary import, or avatar try-on pipeline.

## 2026-05-26 - Phase 4 Real Upload Foundation UX Pass

### Environment

- Branch: `codex/phase-4-real-upload-prettify-foundation`
- Local URL: `http://localhost:3000`
- Surface: mobile viewport in temporary headless Chrome
- Scope: Phase 4 real-mode entry/status UX plus demo-mode regression

### Flow Tested

1. Started the app in real mode with `NEXT_PUBLIC_TRAVOGUE_MODE=real`.
2. Opened `/upload`.
3. Confirmed upload shows a single `item_photo` file picker.
4. Confirmed Outfit photo and Batch upload are marked as later.
5. Opened `/processing/manual-job?batchId=manual-batch` without Supabase/OpenAI credentials.
6. Confirmed processing screen renders failed status and Retry state instead of freezing.
7. Restarted the app in default demo mode.
8. Re-ran the Phase 3 demo trip-flow screenshot script to confirm upload, review, closet, trips, swap, approve, and packing list still work.

### Screenshots

- [Phase 4 real upload entry](../../testing/screenshots/wearabouts-ux-phase4-real-upload.png)
- [Phase 4 processing failed without env](../../testing/screenshots/wearabouts-ux-phase4-processing-failed-no-env.png)
- [Trips empty state regression](../../testing/screenshots/wearabouts-ux-trips-empty.png)
- [Trips start state regression](../../testing/screenshots/wearabouts-ux-trips-start.png)
- [Generated trip looks regression](../../testing/screenshots/wearabouts-ux-trip-looks.png)
- [Packing list regression](../../testing/screenshots/wearabouts-ux-packing-list.png)

### Assets And Scripts

- Phase 4 screenshot helper: `testing/scripts/capture-phase4-real-mode.mjs`
- Demo regression helper: `testing/scripts/capture-trip-flow.mjs`
- New screenshots:
  - `testing/screenshots/wearabouts-ux-phase4-real-upload.png`
  - `testing/screenshots/wearabouts-ux-phase4-processing-failed-no-env.png`

### Findings Fixed In This Pass

- Added a real-mode upload branch while keeping demo upload choices unchanged.
- Added a processing screen with queued, analyzing, prettifying, validating, ready, and failed states.
- Added a failure-safe rendering path for missing real-mode environment variables.
- Replaced raw real-asset image rendering with Next Image using signed-url-safe `unoptimized` rendering.
- Added a pipeline guard so re-running an already-ready job returns the existing garment instead of creating a duplicate review item.

### Remaining Notes

- Live real upload was not executed because this workspace does not contain Supabase and OpenAI credentials.
- The manual failed-processing screenshot validates UI behavior only; it is not evidence that OpenAI generated a closet asset.
- A true Phase 4 end-to-end test still needs `.env.local`, the Supabase migration applied, private buckets available, and one local garment photo.
