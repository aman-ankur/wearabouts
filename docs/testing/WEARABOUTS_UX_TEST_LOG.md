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

## 2026-05-26 - Phase 4 Live Real Upload And Dev Cache Pass

### Environment

- Branch: `codex/fix-openai-image-normalization`
- Local URL: `http://localhost:3000`
- Surface: desktop Chrome viewing the mobile web app frame
- Scope: live Supabase/OpenAI upload, review UI polish, and cached Dev mode

### Flow Tested

1. Started the app with `.env.local` real-mode credentials.
2. Uploaded `IMG_5125.jpg`, an iPhone outfit/person photo, through the real upload flow.
3. Observed the first OpenAI attempt fail with `400 Invalid image file or mode`.
4. Confirmed the stored source image was a valid RGB Display P3 iPhone JPEG.
5. Normalized the source image to orientation-correct sRGB PNG and confirmed OpenAI accepted it.
6. Added normalization before metadata, image edit, and validation calls.
7. Retried/uploaded again and confirmed the job reached `ready`.
8. Reviewed the generated neutral studio shirt asset and added it to Closet.
9. Enlarged review and closet previews so generated real assets are inspectable.
10. Added and tested the in-app **Dev** toggle on `/upload`.
11. Confirmed Dev mode creates a review batch from the latest cached closet asset without starting a processing job or calling OpenAI.
12. Fixed the enlarged review card layout so image, brand text, badges, delete, Retry, and Add controls no longer overlap.
13. Captured a browser screenshot after the generated image finished loading to verify the review layout.

### Findings Fixed In This Pass

- Normalized source images to sRGB PNG before OpenAI calls to support iPhone/Display P3 uploads.
- Enlarged generated asset previews in Review and Closet.
- Added a positioned real-asset image wrapper so signed images stay constrained to their frame.
- Reworked the review card as a vertical approval layout with separated image, metadata, badges, and actions.
- Added in-app Dev mode for cached no-OpenAI UI iteration.
- Added a no-OpenAI dev upload route backed by the latest cached real closet item.
- Updated PR verification after every code change.

### Remaining Notes

- The successful real upload used an outfit/person photo even though Phase 4 is scoped to standalone item photos. The system generated one shirt asset and labelled the input `combo` with low/high confidence depending on run state; true pants/inner-shirt extraction belongs to a future outfit decomposition phase.
- Dev mode currently reuses the latest real closet item. A stronger cache can later use a normalized image hash to reuse the exact matching generated output.
- The floating `N` browser/plugin control visible in manual screenshots is outside the app UI.

## 2026-05-26 - Phase 5 Real Outfit Upload Entry UX Pass

### Environment

- Branch: `codex/phase-5-real-outfit-decomposition`
- Local URL: `http://localhost:3001`
- Surface: mobile viewport in temporary headless Chrome
- Scope: real-mode upload entry and Dev cache outfit-photo UI

### Flow Tested

1. Started the app with `NEXT_PUBLIC_TRAVOGUE_MODE=real`.
2. Opened `/upload` in a 390px mobile viewport.
3. Confirmed real mode now shows Item photo and Outfit photo choices.
4. Confirmed Item photo remains the default standalone-garment path.
5. Selected Outfit photo and confirmed the file picker and primary action update to outfit decomposition copy.
6. Toggled Dev mode while Outfit photo is selected.
7. Confirmed Dev mode keeps the Outfit photo choice and exposes the no-OpenAI multi-card cache action.

### Screenshots

- [Phase 5 real item upload](../../testing/screenshots/wearabouts-ux-phase5-real-upload-item.png)
- [Phase 5 real outfit upload](../../testing/screenshots/wearabouts-ux-phase5-real-upload-outfit.png)
- [Phase 5 dev outfit upload](../../testing/screenshots/wearabouts-ux-phase5-dev-upload-outfit.png)

### Assets And Scripts

- Screenshot capture helper: `testing/scripts/capture-phase5-real-mode.mjs`
- New screenshots:
  - `testing/screenshots/wearabouts-ux-phase5-real-upload-item.png`
  - `testing/screenshots/wearabouts-ux-phase5-real-upload-outfit.png`
  - `testing/screenshots/wearabouts-ux-phase5-dev-upload-outfit.png`

### Findings Fixed In This Pass

- Added the real-mode Item photo / Outfit photo chooser without changing demo upload choices.
- Kept Dev mode available from the upload page and made the outfit-photo Dev action explicit.
- Verified the mobile upload layout has no obvious text or control overlap in item, outfit, or Dev outfit states.

### Remaining Notes

- This pass did not spend OpenAI calls. The live decomposition pipeline still needs the Phase 5 Supabase migration applied before an end-to-end real outfit upload.
- The Dev outfit path uses cached closet assets to exercise the multi-card review UI; it does not prove garment detection quality.

## 2026-05-26 - Phase 5.1 Smart Extraction Selection Verification

### Environment

- Branch: `codex/phase-5-1-smart-extraction-mockups`
- Scope: unit/build verification for smart extraction selection behavior

### Flow Covered

1. Real outfit upload now carries an extraction mode and a default "skip items already in Closet" preference.
2. Default outfit processing scans and stores candidate choices without immediately generating every visible item.
3. Review can render a candidate picker before generation.
4. User-selected candidates are generated through a dedicated selected-candidate route.
5. Core outfit mode generates only top/outerwear and bottoms by default; shoes and accessories remain optional.

### Verification

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Remaining Notes

- This pass did not run live Supabase/OpenAI upload. A live pass should apply `20260526002000_phase5_1_smart_extraction_selection.sql`, upload a repeated-jeans outfit photo, and confirm the picker keeps shoes/accessories optional and allows forced generation of likely duplicates.

## 2026-05-26 - Phase 5.1 Real Scan Latency Benchmark

### Environment

- Branch: `codex/phase-5-1-smart-extraction-mockups`
- Scope: real OpenAI metadata detection benchmark without Supabase uploads, image generation, validation, or closet writes
- Script: `npm run benchmark:detection -- "/path/to/image-or-folder" --limit 3`

### Results

- Original profile: `1600px PNG` with `gpt-5.4`
  - Average scan time: about 17.16 seconds
  - Average total tokens: about 2,975
  - Average normalized image size: about 3.85 MB
- Fast profile: `1024px JPEG` with `gpt-5.4`
  - Average scan time: about 7.63 seconds
  - Average total tokens: about 1,605
  - Average normalized image size: about 127 KB
- Candidate counts matched on all three sampled photos.

### Decision

- Use the `1024px JPEG` profile for metadata detection by default.
- Keep generated closet assets on the existing selected-crop image generation path.
- Keep faster metadata models as an experiment, not default; `gpt-4.1-mini` was slightly faster in the same sample but missed one smartwatch candidate.

## 2026-05-26 - Phase 5.1 Detected Photo Reference Picker

### Environment

- Branch: `codex/phase-5-1-smart-extraction-mockups`
- Local URL: `http://localhost:3000`
- Scope: real outfit review picker after scan

### Flow Covered

1. Loaded an existing real scan-only outfit batch.
2. Confirmed the batch API now includes a signed uploaded source image reference.
3. Added the uploaded-photo reference above the candidate checklist.
4. Rendered numbered bounding boxes over the uploaded photo using existing candidate bounding boxes.
5. Added row-level crop thumbnails so each checklist item has a visible local reference.

### Verification

- `npm run test -- src/features/wardrobe/components/DetectedCandidatePhotoReference.test.tsx src/features/wardrobe/real/supabaseMappers.test.ts`
- `npm run typecheck`
- `npm run lint`

### Remaining Notes

- The overlay uses normalized candidate bounding boxes from the detection model and does not add OpenAI calls.
- The row crop thumbnails use focal positioning around each bounding box center; a future pass can use exact CSS clipping if we want tighter crop previews.

## 2026-05-27 - Phase 5.1 Extraction Review Visual Polish

### Environment

- Branch: `codex/phase-5-1-smart-extraction-mockups`
- Local URL: `http://localhost:3000`
- Scope: real outfit review picker and generated review card polish

### Flow Covered

1. Replaced source-photo rectangle overlays with soft numbered markers and short dotted leader lines.
2. Kept candidate colors only on the uploaded-photo marker system, where they help map detection points to the legend.
3. Changed candidate checklist rows to neutral Wearabouts styling: selected rows use a black border and `Selected` pill, optional rows stay visually quieter.
4. Replaced the checkbox-like duplicate control with a compact `Closet matching` status control.
5. Kept source crop thumbnails in candidate rows and zoomed them around the detected candidate center.
6. Added a clickable generated-artwork preview on detected garment cards. The preview opens in a dark bottom sheet so the prettified item can be inspected at a larger size before adding it.

### Verification

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Confirmed the review page returns `200 OK` on `http://localhost:3000` after restarting the dev server.

### Remaining Notes

- The visual picker still uses normalized model bounding boxes from detection; no extra OpenAI calls were added for thumbnails or markers.
- Running `npm run build` while `next dev` is active can leave stale `.next` chunks in the dev server. Restart the dev server on port 3000 after production builds before manual browser testing.
