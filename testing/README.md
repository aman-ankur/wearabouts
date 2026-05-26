# Wearabouts Testing Assets

This folder holds manual testing artifacts for Wearabouts.

- Put screenshots in `testing/screenshots/`.
- Update `docs/testing/WEARABOUTS_UX_TEST_LOG.md` after each manual UX pass.
- Name screenshots with the pattern `wearabouts-ux-<screen-or-flow>.png` so they stay easy to scan.
- `testing/scripts/capture-trip-flow.mjs` captures the Phase 3 Trips flow against a temporary Chrome debugging session on port 9222.
- `testing/scripts/capture-phase4-real-mode.mjs` captures Phase 4 real-mode upload and failed-processing screens. Run the app with `NEXT_PUBLIC_TRAVOGUE_MODE=real` first.
- `testing/scripts/capture-phase5-real-mode.mjs` captures Phase 5 real-mode item/outfit upload choices and Dev outfit upload UI. Run the app with `NEXT_PUBLIC_TRAVOGUE_MODE=real` first.
- The Upload page includes an in-app **Dev** toggle for no-OpenAI UI testing. Dev mode reuses the latest cached real closet asset and routes directly to Review.
- Phase 5.1 real outfit upload defaults to scanning first. Review can show detected candidate choices before image generation, and selected candidate generation uses `/api/wardrobe/jobs/[jobId]/candidates/generate`.
- The Phase 5.1 smart extraction selection mockup is `docs/product/mockups/wearabouts-phase5-1-smart-extraction-selection.html`.

Current screenshot set:

- `screenshots/wearabouts-ux-home.png`
- `screenshots/wearabouts-ux-upload.png`
- `screenshots/wearabouts-ux-review-top.png`
- `screenshots/wearabouts-ux-closet-top.png`
- `screenshots/wearabouts-ux-mixer-top.png`
- `screenshots/wearabouts-ux-mixer-locked.png`
- `screenshots/wearabouts-ux-saved-look-full.png`
- `screenshots/wearabouts-ux-trips-empty.png`
- `screenshots/wearabouts-ux-trips-start.png`
- `screenshots/wearabouts-ux-trip-looks.png`
- `screenshots/wearabouts-ux-packing-list.png`
- `screenshots/wearabouts-ux-phase4-real-upload.png`
- `screenshots/wearabouts-ux-phase4-processing-failed-no-env.png`
- `screenshots/wearabouts-ux-phase5-real-upload-item.png`
- `screenshots/wearabouts-ux-phase5-real-upload-outfit.png`
- `screenshots/wearabouts-ux-phase5-dev-upload-outfit.png`
