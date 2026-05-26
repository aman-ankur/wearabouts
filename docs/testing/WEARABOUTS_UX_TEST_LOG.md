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
8. Mixer renders body preview, rails, and lock controls.
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

### Remaining Notes

- Demo state is still in-memory only by design for Phase 2.
- Closet filters are simple category filters; no persisted filter state yet.
- Saved looks are summary rows only; they do not render outfit thumbnails yet.
