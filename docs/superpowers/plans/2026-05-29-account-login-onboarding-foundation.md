# Account Login Onboarding Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Wearabouts account slice: public demo entry, email OTP login, minimal onboarding, and Circle/profile persistence.

**Architecture:** Keep the public demo fixture-backed and no-login. Add a focused `src/features/account/` layer for auth/session helpers, onboarding validation, Supabase account persistence, and browser auth client creation. Add account tables now, while leaving full wardrobe API ownership migration for the next implementation plan.

**Tech Stack:** Next.js App Router, React client pages, TypeScript, Vitest, Supabase Auth email OTP, Supabase service-role server routes.

---

## Scope

This plan implements:

- `/` as the entry screen with `Explore demo` and `Build your own`.
- `/demo` as the current app home experience.
- `/login` for email OTP code login.
- `/onboarding` for name + gender/presentation setup.
- `GET/POST /api/account/me` for authenticated onboarding state.
- Supabase tables for `circles`, `circle_members`, and `wardrobe_profiles`.

This plan does not migrate existing wardrobe/upload/avatar API routes away from `REAL_HOUSEHOLD_ID` and `REAL_PROFILE_ID`. That is Phase C from the design spec and should be its own implementation plan because it touches all real-mode data routes.

## File Structure

- Create `src/features/account/accountTypes.ts`: shared account, Circle, profile, and gender/presentation types.
- Create `src/features/account/accountProfile.ts`: pure profile validation and default Circle-name helpers.
- Create `src/features/account/accountProfile.test.ts`: TDD coverage for profile validation/default naming.
- Create `src/features/account/accountSession.ts`: parse Bearer tokens from route headers.
- Create `src/features/account/accountSession.test.ts`: TDD coverage for auth header parsing.
- Create `src/features/account/supabaseBrowserClient.ts`: browser Supabase auth client from public env vars.
- Create `src/features/account/supabaseAccountServerClient.ts`: service-role Supabase client for account API routes without requiring OpenAI config.
- Create `src/features/account/accountPersistence.ts`: service functions to read/create default Circle and wardrobe profile.
- Create `src/features/account/accountApiClient.ts`: browser helper for calling `/api/account/me` with the current access token.
- Create `app/api/account/me/route.ts`: authenticated account status and onboarding completion endpoint.
- Create `app/login/page.tsx`: email OTP login UI.
- Create `app/onboarding/page.tsx`: minimal onboarding UI.
- Create `src/features/wardrobe/components/WearaboutsHome.tsx`: extracted current home app experience.
- Modify `app/page.tsx`: replace current home with entry screen.
- Create `app/demo/page.tsx`: render `WearaboutsHome`.
- Modify `src/features/wardrobe/components/BottomNav.tsx`: point Home to `/demo`.
- Create `supabase/migrations/20260529000000_account_circles_profiles.sql`: account/Circle/profile tables.

## Task 1: Account Types And Profile Validation

**Files:**

- Create: `src/features/account/accountTypes.ts`
- Create: `src/features/account/accountProfile.test.ts`
- Create: `src/features/account/accountProfile.ts`

- [ ] **Step 1: Write failing tests**

Create `src/features/account/accountProfile.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createDefaultCircleName, parseGenderPresentation, validateOnboardingProfile } from "./accountProfile";

describe("accountProfile", () => {
  it("accepts a display name and gender presentation", () => {
    expect(validateOnboardingProfile({ displayName: " Aankur ", genderPresentation: "men" })).toEqual({
      ok: true,
      value: { displayName: "Aankur", genderPresentation: "men" },
    });
  });

  it("rejects an empty display name", () => {
    expect(validateOnboardingProfile({ displayName: " ", genderPresentation: "men" })).toEqual({
      ok: false,
      error: "Enter your name to finish setup.",
    });
  });

  it("rejects an unsupported gender presentation", () => {
    expect(validateOnboardingProfile({ displayName: "Aankur", genderPresentation: "unknown" })).toEqual({
      ok: false,
      error: "Choose a valid style profile option.",
    });
  });

  it("parses the supported gender presentation options", () => {
    expect(parseGenderPresentation("men")).toBe("men");
    expect(parseGenderPresentation("women")).toBe("women");
    expect(parseGenderPresentation("unisex")).toBe("unisex");
    expect(parseGenderPresentation("prefer_not_to_say")).toBe("prefer_not_to_say");
    expect(parseGenderPresentation("other")).toBeNull();
  });

  it("creates a friendly default Circle name", () => {
    expect(createDefaultCircleName("Aankur")).toBe("Aankur's Circle");
    expect(createDefaultCircleName(" ")).toBe("My Circle");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/features/account/accountProfile.test.ts
```

Expected: fail because `accountProfile.ts` does not exist.

- [ ] **Step 3: Implement types and validation**

Create `src/features/account/accountTypes.ts`:

```ts
export type GenderPresentation = "men" | "women" | "unisex" | "prefer_not_to_say";

export interface OnboardingProfileInput {
  displayName: unknown;
  genderPresentation: unknown;
}

export interface OnboardingProfile {
  displayName: string;
  genderPresentation: GenderPresentation;
}

export interface CircleSummary {
  id: string;
  name: string;
}

export interface WardrobeProfileSummary {
  id: string;
  circleId: string;
  displayName: string;
  genderPresentation: GenderPresentation;
  profileType: "personal" | "shared";
}

export interface AccountStatus {
  email: string | null;
  onboardingComplete: boolean;
  circle: CircleSummary | null;
  profile: WardrobeProfileSummary | null;
}
```

Create `src/features/account/accountProfile.ts`:

```ts
import type { GenderPresentation, OnboardingProfile, OnboardingProfileInput } from "./accountTypes";

const supportedGenderPresentations: GenderPresentation[] = ["men", "women", "unisex", "prefer_not_to_say"];

export type OnboardingProfileValidation =
  | { ok: true; value: OnboardingProfile }
  | { ok: false; error: string };

export function parseGenderPresentation(value: unknown): GenderPresentation | null {
  return typeof value === "string" && supportedGenderPresentations.includes(value as GenderPresentation)
    ? (value as GenderPresentation)
    : null;
}

export function validateOnboardingProfile(input: OnboardingProfileInput): OnboardingProfileValidation {
  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
  if (!displayName) {
    return { ok: false, error: "Enter your name to finish setup." };
  }

  const genderPresentation = parseGenderPresentation(input.genderPresentation);
  if (!genderPresentation) {
    return { ok: false, error: "Choose a valid style profile option." };
  }

  return { ok: true, value: { displayName, genderPresentation } };
}

export function createDefaultCircleName(displayName: string): string {
  const cleanName = displayName.trim();
  return cleanName ? `${cleanName}'s Circle` : "My Circle";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/features/account/accountProfile.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/features/account/accountTypes.ts src/features/account/accountProfile.ts src/features/account/accountProfile.test.ts
git commit -m "Add account profile validation"
```

## Task 2: Account Session Token Helper

**Files:**

- Create: `src/features/account/accountSession.test.ts`
- Create: `src/features/account/accountSession.ts`

- [ ] **Step 1: Write failing tests**

Create `src/features/account/accountSession.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getBearerTokenFromAuthorizationHeader } from "./accountSession";

describe("accountSession", () => {
  it("returns the bearer token from an authorization header", () => {
    expect(getBearerTokenFromAuthorizationHeader("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("trims extra whitespace around the bearer token", () => {
    expect(getBearerTokenFromAuthorizationHeader("Bearer   token-value   ")).toBe("token-value");
  });

  it("returns null for missing or non-bearer headers", () => {
    expect(getBearerTokenFromAuthorizationHeader(null)).toBeNull();
    expect(getBearerTokenFromAuthorizationHeader("Basic abc")).toBeNull();
    expect(getBearerTokenFromAuthorizationHeader("Bearer ")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/features/account/accountSession.test.ts
```

Expected: fail because `accountSession.ts` does not exist.

- [ ] **Step 3: Implement helper**

Create `src/features/account/accountSession.ts`:

```ts
export function getBearerTokenFromAuthorizationHeader(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/features/account/accountSession.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/features/account/accountSession.ts src/features/account/accountSession.test.ts
git commit -m "Add account session token helper"
```

## Task 3: Account Persistence And API Route

**Files:**

- Create: `src/features/account/supabaseAccountServerClient.ts`
- Create: `src/features/account/accountPersistence.ts`
- Create: `app/api/account/me/route.ts`
- Create: `supabase/migrations/20260529000000_account_circles_profiles.sql`

- [ ] **Step 1: Add migration**

Create `supabase/migrations/20260529000000_account_circles_profiles.sql` with `circles`, `circle_members`, and `wardrobe_profiles`. Use `auth.users(id)` foreign keys, unique membership by `(circle_id, user_id)`, and one personal profile per `(circle_id, owner_user_id)`.

- [ ] **Step 2: Implement server client**

Create `src/features/account/supabaseAccountServerClient.ts` with a service-role Supabase client that requires only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 3: Implement persistence service**

Create `src/features/account/accountPersistence.ts` with:

- `getAccountStatusForUser(supabase, user)`
- `completeAccountOnboarding(supabase, user, profile)`

The completion function should create or reuse a Circle, create or update the user's personal wardrobe profile, and return `AccountStatus`.

- [ ] **Step 4: Implement route**

Create `app/api/account/me/route.ts`:

- `GET` validates `Authorization: Bearer <access token>` and returns `AccountStatus`.
- `POST` validates the token and body, completes onboarding, and returns `AccountStatus`.
- Missing/invalid token returns `401`.
- Invalid onboarding body returns `400`.

- [ ] **Step 5: Run verification**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/features/account/supabaseAccountServerClient.ts src/features/account/accountPersistence.ts app/api/account/me/route.ts supabase/migrations/20260529000000_account_circles_profiles.sql
git commit -m "Add account onboarding API"
```

## Task 4: Browser Auth Client And Account API Client

**Files:**

- Create: `src/features/account/supabaseBrowserClient.ts`
- Create: `src/features/account/accountApiClient.ts`

- [ ] **Step 1: Implement browser client**

Create `src/features/account/supabaseBrowserClient.ts` with a memoized `getSupabaseBrowserClient()` that returns `null` when `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing.

- [ ] **Step 2: Implement API client**

Create `src/features/account/accountApiClient.ts` with:

- `fetchAccountStatus(accessToken)`
- `completeOnboarding(accessToken, input)`

Both functions call `/api/account/me` with `Authorization: Bearer <token>`.

- [ ] **Step 3: Run verification**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/features/account/supabaseBrowserClient.ts src/features/account/accountApiClient.ts
git commit -m "Add browser account clients"
```

## Task 5: Public Entry And Demo Home

**Files:**

- Create: `src/features/wardrobe/components/WearaboutsHome.tsx`
- Modify: `app/page.tsx`
- Create: `app/demo/page.tsx`
- Modify: `src/features/wardrobe/components/BottomNav.tsx`

- [ ] **Step 1: Extract current home experience**

Move the current app home implementation from `app/page.tsx` into `src/features/wardrobe/components/WearaboutsHome.tsx` and export `WearaboutsHome`.

- [ ] **Step 2: Add demo route**

Create `app/demo/page.tsx` that renders `<WearaboutsHome />`.

- [ ] **Step 3: Replace root page**

Replace `app/page.tsx` with an entry screen containing:

- Wearabouts title and short positioning.
- `Explore demo` linking to `/demo`.
- `Build your own` linking to `/login`.

- [ ] **Step 4: Update bottom nav**

Change the Home link in `BottomNav` from `/` to `/demo`.

- [ ] **Step 5: Run verification**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add app/page.tsx app/demo/page.tsx src/features/wardrobe/components/WearaboutsHome.tsx src/features/wardrobe/components/BottomNav.tsx
git commit -m "Add public demo entry flow"
```

## Task 6: Login And Onboarding Screens

**Files:**

- Create: `app/login/page.tsx`
- Create: `app/onboarding/page.tsx`

- [ ] **Step 1: Add login page**

Create a client page with email entry, OTP code entry, resend, error states, and a fallback message when public Supabase env vars are missing.

- [ ] **Step 2: Add onboarding page**

Create a client page that:

- Reads the current Supabase session.
- Redirects to `/login` when missing.
- Calls `GET /api/account/me`.
- Redirects completed users to `/demo`.
- Lets incomplete users submit name + gender/presentation.
- Calls `POST /api/account/me`.
- Shows `Add first item` and `Explore starter closet` after completion.

- [ ] **Step 3: Run verification**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add app/login/page.tsx app/onboarding/page.tsx
git commit -m "Add OTP login and onboarding screens"
```

## Task 7: Final Verification

**Files:**

- No new files.

- [ ] **Step 1: Run full checks**

Run:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 2: Manual smoke check**

Start the dev server on port 3000 after checking for existing port usage:

```bash
npm run dev -- -p 3000
```

Smoke check:

- `/` shows `Explore demo` and `Build your own`.
- `/demo` shows the Wearabouts app home.
- `/login` shows email OTP UI.
- `/onboarding` redirects or asks for setup depending on session.

- [ ] **Step 3: Commit any final fixes**

If fixes were needed, commit them with a focused message.

## Self-Review

- Spec coverage: this plan covers public demo entry, email OTP login, minimal onboarding, Circle naming, Circle/profile tables, account status API, and demo/personal path separation. Full wardrobe data isolation is intentionally deferred to a follow-up plan because it is a separate multi-route migration.
- Placeholder scan: no `TBD`, `TODO`, or undefined future steps are required to complete this slice.
- Type consistency: `GenderPresentation`, `AccountStatus`, `CircleSummary`, and `WardrobeProfileSummary` are defined before use.
