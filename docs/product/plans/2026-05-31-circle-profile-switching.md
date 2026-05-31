# Circle Profile Switching Implementation Plan

**Goal:** Let one authenticated Wearabouts Circle contain multiple wardrobe profiles, such as male and female profiles, with the active profile driving wardrobe upload, closet, Mixer, Stylist, and Avatar Studio data.

**Architecture:** Account status returns the Circle plus all wardrobe profiles. The browser stores the active profile ID locally and sends it on real wardrobe/avatar API calls. Server routes validate that requested profile IDs belong to the authenticated user's Circle before reading or writing profile-owned data.

**Status:** Implemented on `codex/circle-profile-switching`.

**Delivered:**

- Supabase migration `20260531000000_circle_multiple_profiles.sql` removes the old one-profile uniqueness constraint and adds a lookup index for Circle profile switching.
- Account status includes `profiles`, and real wardrobe/avatar routes honor the selected profile through the active profile header.
- Profile settings can add additional Circle profiles, edit the selected profile's name/style, and switch active profile context.
- The app shell exposes active profile switching outside settings when multiple profiles exist.
- The Profile page now uses a Circle dashboard layout with a charcoal active-profile hero, member list, focused edit form, compact add profile flow, and lower-emphasis sign out action.
- Profile creation has a server compatibility fallback for older databases that still have the legacy `wardrobe_profiles_circle_id_owner_user_id_profile_type_key` constraint, and account API client errors no longer surface raw empty-body JSON parse failures.
- Design mockups live in `docs/product/mockups/2026-06-01-profile-dashboard-refinements.html`.

**Tasks:**

- [x] Add a Supabase migration that allows multiple `personal` wardrobe profiles for one Circle owner.
- [x] Extend account types and persistence so account status includes `profiles`.
- [x] Add authenticated profile creation and selected-profile update APIs.
- [x] Add client helpers for active profile storage and the `X-Wearabouts-Profile-Id` wardrobe request header.
- [x] Update wardrobe/avatar routes to honor the selected profile through `requireAccountSession`.
- [x] Add a profile switcher UI and settings UI for creating and editing Circle profiles.
- [x] Reload real closet/avatar data when the selected profile changes.
- [x] Verify with targeted unit tests, then `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
