# Circle Profile Switching Implementation Plan

**Goal:** Let one authenticated Wearabouts Circle contain multiple wardrobe profiles, such as male and female profiles, with the active profile driving wardrobe upload, closet, Mixer, Stylist, and Avatar Studio data.

**Architecture:** Account status returns the Circle plus all wardrobe profiles. The browser stores the active profile ID locally and sends it on real wardrobe/avatar API calls. Server routes validate that requested profile IDs belong to the authenticated user's Circle before reading or writing profile-owned data.

**Tasks:**

- Add a Supabase migration that allows multiple `personal` wardrobe profiles for one Circle owner.
- Extend account types and persistence so account status includes `profiles`.
- Add an authenticated profile creation API for adding another Circle profile.
- Add client helpers for active profile storage and the `X-Wearabouts-Profile-Id` wardrobe request header.
- Update wardrobe/avatar routes to honor the selected profile through `requireAccountSession`.
- Add a profile switcher UI and settings UI for creating additional Circle profiles.
- Reload real closet/avatar data when the selected profile changes.
- Verify with targeted unit tests, then `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
