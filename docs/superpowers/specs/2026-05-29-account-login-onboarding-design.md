# Wearabouts Account, Login, And Onboarding Design

## Summary

Wearabouts needs a real account boundary before personal wardrobe, avatar, upload, and trip data can be durable. The first version uses email OTP login, a minimal personal profile, a public no-login demo, and a temporary guest workspace so people can try real upload/avatar flows before creating an account.

The product term for a shared account space is **Circle**, not household. A Circle can represent one person, partners, family, roommates, or a shared travel group. The first release creates one Circle and one wardrobe profile automatically, while keeping the data model ready for future partner, kid, and shared profiles.

## Goals

- Let visitors try Wearabouts without logging in.
- Keep demo mode instant, polished, and free of model-provider cost.
- Let temporary guests try real upload, Wardrobe Prep, closet, and Avatar Studio flows without seeing other users' data.
- Use login for durable private wardrobe/profile ownership.
- Use email OTP code login only: no password and no magic-link-first product path.
- Create a minimal profile with only name and gender/presentation.
- Introduce Circle ownership so future shared profiles are natural rather than bolted on later.
- Isolate real data by authenticated Circle/profile or temporary guest Circle/profile.

## Non-Goals

- Partner invites or multi-login Circle sharing in the first account slice.
- Password login.
- Social features.
- Migrating a temporary guest workspace into a newly created account.
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

- Upload personal photos into the fixture-backed demo.
- Save permanent outfits.
- Create avatar inputs.
- Generate real model-backed outputs.
- Mutate private Supabase data.

When a demo user taps a personal action, Wearabouts can move them into the temporary guest real flow or show a friendly auth prompt such as `Build your own closet`.

### Try As A Temporary Guest

Temporary guest mode is for visitors who want to see whether real Wardrobe Prep and Avatar Studio are worth trusting before they sign in.

Guest behavior:

- The browser creates a random guest UUID in localStorage.
- Wardrobe/avatar API calls send that guest ID only when no Supabase session exists.
- Server routes validate the guest ID and derive a synthetic Circle/profile pair from it.
- Rows and storage paths are still scoped as `circleId/profileId/assetId.ext`.
- A guest can upload, review, add to closet, use Mixer/Stylist from their generated closet, set up an avatar, render saved outfits, and delete their own renders.

Guest limits:

- Guest work is browser-local and temporary. Clearing localStorage loses the pointer to it.
- Guest data is not yet migrated into an account after login.
- Account APIs, onboarding, settings, and profile editing remain auth-only.
- Public `/demo` remains fixture-backed and does not spend model-provider cost.

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

Every real wardrobe/avatar API route should:

1. Prefer the Supabase auth session when a bearer token is present.
2. Resolve the user's active Circle membership and current wardrobe profile.
3. If no bearer token exists, accept only a validated temporary guest ID on guest-enabled wardrobe/avatar routes.
4. Derive the guest Circle/profile server-side from that guest ID.
5. Query or mutate only rows inside the resolved Circle/profile.
6. Ignore client-submitted `circleId` for authorization.

Client-submitted `profileId` can be accepted only after the server verifies the profile belongs to the authenticated user's Circle or the derived guest profile.

Current real-mode constants should be phased out:

- `REAL_HOUSEHOLD_ID` should be replaced by a session-derived `circleId`.
- `REAL_PROFILE_ID` should be replaced by the current selected `wardrobeProfileId`.

The constants can remain only as fixture/dev identifiers. Real wardrobe/avatar routes should use session-derived ownership.

## Storage Paths

Private storage paths should include Circle and profile ownership:

```text
circleId/profileId/assetId.ext
```

This should apply to source images, closet assets, and avatar assets.

Server routes should validate that persisted storage paths match the resolved Circle/profile before saving metadata.

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

- Account routes should work only with an authenticated user.
- Guest-enabled wardrobe/avatar routes should work only with an authenticated user or a valid temporary guest ID.
- No user or guest should be able to access another Circle by guessing IDs.
- Upload and avatar storage paths must be scoped to Circle/profile.
- API responses should not return signed URLs for assets outside the resolved Circle/profile.
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

- Personal actions should lead to temporary guest mode or login instead of failing silently.
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
- Resolve Circle/profile from the authenticated session or temporary guest ID.
- Keep existing development rows available only when intentionally migrated into a default Circle/profile.
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

- Account routes reject unauthenticated requests.
- Guest-enabled wardrobe/avatar routes accept a valid guest ID and reject requests with neither auth nor guest ID.
- Private routes use resolved Circle/profile instead of client-submitted Circle IDs.
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
2. Let temporary guests try personal photos, real saves, avatar setup, and model-backed work in a browser-local workspace.
3. Keep onboarding minimal with name and gender/presentation.
4. Create a default Circle and personal wardrobe profile behind the scenes.
5. Move all private data access to session-derived Circle/profile ownership before exposing multi-profile features.
