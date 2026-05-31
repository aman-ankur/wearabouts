# Wearabouts Account, Login, And Onboarding Design

## Summary

Wearabouts needs a real account boundary before personal wardrobe, avatar, upload, and trip data can be private. The first version should use email OTP login, a minimal personal profile, and a public no-login demo that lets anyone understand the product before trusting it with photos.

The product term for a shared account space is **Circle**, not household. A Circle can represent one person, partners, family, roommates, or a shared travel group. The first release creates one Circle and one wardrobe profile automatically, while keeping the data model ready for future partner, kid, and shared profiles.

## Goals

- Let visitors try Wearabouts without logging in.
- Keep demo mode instant, polished, and free of model-provider cost.
- Require login before any personal upload, avatar setup, saved real outfit, or private wardrobe mutation.
- Use email OTP code login only: no password and no magic-link-first product path.
- Create a minimal profile with only name and gender/presentation.
- Introduce Circle ownership so future shared profiles are natural rather than bolted on later.
- Isolate private data by authenticated Circle and wardrobe profile.

## Non-Goals

- Partner invites or multi-login Circle sharing in the first account slice.
- Password login.
- Social features.
- Guest uploads.
- Guest generation.
- Complex style questionnaires during onboarding.
- Family profile management UI in the first slice.

## Entry Flow

The first screen should be the real Wearabouts experience doorway, not a marketing landing page.

### Explore Demo

`Explore demo` opens a no-login sample Wearabouts workspace. It uses fixture data only and should feel like the actual app, not a static tour.

Users can:

- Browse the home feed.
- Use the Closet Mixer.
- Open Stylist recommendations.
- View Trip Looks.
- Inspect the packing list flow.
- See avatar examples from sample data.

Users cannot:

- Upload personal photos.
- Save permanent outfits.
- Create avatar inputs.
- Generate real model-backed outputs.
- Mutate private Supabase data.

When a demo user taps a personal action, Wearabouts should show a friendly auth prompt such as `Build your own closet` and take them to login.

### Build Your Own

`Build your own` starts email OTP login. After code verification:

1. If the account already has onboarding complete, send the user into the app.
2. If this is a new account or incomplete account, create the default Circle and send the user through minimal onboarding.

## Login Design

Use Supabase Auth email OTP as the identity layer.

The product UI should be:

1. Enter email.
2. Send code.
3. Enter 6-digit code.
4. Verify code.
5. Continue to onboarding or the app.

The app should not present password login in v1. It should also avoid a magic-link-led experience, even if Supabase sends or supports links under the hood. The core user action is typing the OTP code.

## Minimal Onboarding

After first login, ask only:

- Name.
- Gender/presentation.

The gender/presentation field should tune starter recommendations and defaults, not lock the user into a rigid category.

Initial options:

- Men.
- Women.
- Unisex / flexible.
- Prefer not to say.

After onboarding, show a simple choice:

- `Add first item`
- `Explore starter closet`

`Add first item` starts the upload flow. `Explore starter closet` opens the app with starter/sample wardrobe items while the user's real closet is still empty.

## Product Language

Use **Circle** for the shared ownership space.

Examples:

- `My Circle`
- `Aankur's Circle`
- `Invite someone to your Circle` in a future phase.
- `Shared items in this Circle` in a future phase.

Avoid **Household** in user-facing language because it implies a family or cohabiting home. Circle is flexible enough for spouse, girlfriend/boyfriend, kids, parents, roommates, or solo usage.

## Ownership Model

Introduce three account-level concepts.

### Account

The authenticated Supabase user. This is the login identity and is tied to email OTP.

### Circle

The private shared space for wardrobe data. A new account gets one default Circle automatically.

Suggested table: `circles`

Core fields:

- `id`
- `name`
- `created_by_user_id`
- `created_at`
- `updated_at`

### Circle Member

The relationship between an authenticated account and a Circle. In v1, the first user is the owner/admin.

Suggested table: `circle_members`

Core fields:

- `id`
- `circle_id`
- `user_id`
- `role`
- `created_at`

Initial roles:

- `owner`
- `member`

Only `owner` is needed in v1, but including `member` keeps the future invite model straightforward.

### Wardrobe Profile

The person/style profile inside a Circle. In v1 there is one personal profile created from onboarding.

Suggested table: `wardrobe_profiles`

Core fields:

- `id`
- `circle_id`
- `owner_user_id`
- `display_name`
- `gender_presentation`
- `profile_type`
- `created_at`
- `updated_at`

Initial `profile_type` values:

- `personal`
- `shared`

Only `personal` is exposed in v1. `shared` can be reserved for future shared travel gear or shared wardrobe items.

## Data Ownership Rules

All private wardrobe data should belong to a Circle and usually to a wardrobe profile.

Rows should include:

- `circle_id`
- `profile_id` where profile-specific

This applies to:

- Upload batches.
- Source images.
- Wardrobe Prep jobs.
- Garment candidates.
- Detected garments.
- Wardrobe items.
- Saved outfits.
- Trip looks and trips when persisted.
- Avatar profiles.
- Avatar renders.
- Generated garment cache records.

Shared assets can later use either a `shared` wardrobe profile or a separate ownership flag. The v1 design should not expose that choice in UI yet.

## API And Session Flow

Every private API route should:

1. Read the Supabase auth session.
2. Resolve the user's active Circle membership.
3. Resolve the current wardrobe profile.
4. Query or mutate only rows inside that Circle.
5. Ignore client-submitted `circleId` for authorization.

Client-submitted `profileId` can be accepted only after the server verifies the profile belongs to one of the user's Circles.

Current real-mode constants should be phased out:

- `REAL_HOUSEHOLD_ID` should be replaced by a session-derived `circleId`.
- `REAL_PROFILE_ID` should be replaced by the current selected `wardrobeProfileId`.

During migration, the constants can remain only as a dev/demo fallback while account-aware routes are introduced.

## Storage Paths

Private storage paths should include Circle and profile ownership:

```text
circleId/profileId/assetId.ext
```

This should apply to source images, closet assets, and avatar assets.

Server routes should validate that persisted storage paths match the authenticated Circle/profile before saving metadata.

## Public Demo Boundary

Public demo mode should stay fixture-backed.

It should not:

- Read private Supabase tables.
- Write private Supabase tables.
- Upload user files.
- Call paid model providers.
- Create a real anonymous user account.

This keeps the demo cheap, fast, privacy-safe, and easy to reset.

The demo should still feel complete. It should showcase the product's strongest moments with starter data:

- A clean wardrobe.
- Good outfit boards.
- A few saved looks.
- Trip looks and packing.
- Avatar render examples.

## Security

Once account-aware routes are in place, enable row level security for private tables where practical. Service-role access can still be used server-side for model and storage workflows, but application logic must check Circle membership before using the service-role client to read or mutate user data.

Minimum security expectations:

- No private route should work without an authenticated user.
- No user should be able to access another Circle by guessing IDs.
- Upload and avatar storage paths must be scoped to Circle/profile.
- API responses should not return signed URLs for assets outside the authenticated Circle.
- Demo routes and fixtures must not expose private production data.

## Error Handling

Login:

- Invalid or expired OTP should keep the user on the code screen with a clear retry path.
- Users should be able to resend the code after a short cooldown.
- Returning users with completed onboarding should skip onboarding.

Onboarding:

- Missing name blocks completion.
- Gender/presentation can use `Prefer not to say`.
- If Circle/profile creation fails after auth succeeds, the app should retry or resume onboarding rather than creating duplicate profiles.

Demo:

- Personal actions should lead to login instead of failing silently.
- Demo should make it clear when data is sample data.

## Implementation Phases

### Phase A: Public Demo And Entry Flow

- Make the no-login demo path explicit.
- Add the entry screen with `Explore demo` and `Build your own`.
- Gate personal actions behind login.
- Keep demo backed by fixtures only.

### Phase B: Account Foundation

- Add Supabase email OTP login UI.
- Add auth/session helpers.
- Add `circles`, `circle_members`, and `wardrobe_profiles` migrations.
- Create default Circle and wardrobe profile after onboarding.
- Add minimal onboarding screens.

### Phase C: Data Isolation

- Replace hard-coded real-mode ownership constants in wardrobe, upload, closet, and avatar APIs.
- Resolve Circle/profile from the authenticated session.
- Migrate existing development rows into a default Circle/profile.
- Add tests for route-level ownership checks and cross-user isolation.
- Enable RLS or equivalent table policies after routes are account-aware.

### Phase D: Circle Sharing Later

- Add profile switcher.
- Add invite flow.
- Add partner/family/member login.
- Add shared profile/items.
- Add Circle member permissions.

## Testing Strategy

Unit tests:

- Account/session helper resolves current Circle and profile.
- Onboarding creation is idempotent.
- Profile ownership validation rejects profiles outside the user's Circle.

Route tests:

- Private routes reject unauthenticated requests.
- Private routes use session Circle/profile instead of client-submitted Circle IDs.
- Cross-user access is rejected.

UI tests:

- Public demo loads without login.
- Personal demo actions redirect to login.
- Email OTP screens handle send, verify, resend, invalid code, and returning-user flows.
- New users complete name + gender/presentation onboarding.

Migration tests or SQL review:

- New tables have expected constraints and indexes.
- Private tables include Circle/profile ownership.
- RLS policies match membership rules once enabled.

## Open Decisions Deferred

- Exact invite mechanics for adding another person to a Circle.
- Whether shared items use a `shared` wardrobe profile or item-level ownership.
- Whether one account can belong to multiple Circles in the first shared-profile release.
- Whether children have login accounts or only managed profiles.
- Final copy for gender/presentation labels.

## Recommendation

Build the demo-first account model:

1. Let everyone explore a polished fixture-backed Wearabouts demo without login.
2. Require email OTP before personal photos, real saves, avatar setup, or model-backed work.
3. Keep onboarding minimal with name and gender/presentation.
4. Create a default Circle and personal wardrobe profile behind the scenes.
5. Move all private data access to session-derived Circle/profile ownership before exposing multi-profile features.
