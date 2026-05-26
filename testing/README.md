# Wearabouts Testing Assets

This folder holds manual testing artifacts for Wearabouts.

- Put screenshots in `testing/screenshots/`.
- Update `docs/testing/WEARABOUTS_UX_TEST_LOG.md` after each manual UX pass.
- Name screenshots with the pattern `wearabouts-ux-<screen-or-flow>.png` so they stay easy to scan.
- `testing/scripts/capture-trip-flow.mjs` captures the Phase 3 Trips flow against a temporary Chrome debugging session on port 9222.
- `testing/scripts/capture-phase4-real-mode.mjs` captures Phase 4 real-mode upload and failed-processing screens. Run the app with `NEXT_PUBLIC_TRAVOGUE_MODE=real` first.

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
