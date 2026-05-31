# Temporary Guest Real Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let real Wardrobe Prep and Avatar Studio work end to end without sign-in by giving each browser a temporary guest workspace.

**Architecture:** The browser owns a random guest UUID in localStorage and sends it as `X-Wearabouts-Guest-Id` when no Supabase session exists. Wardrobe/avatar API routes accept either a real account session or a validated guest header, then use the same Supabase-backed services with owner IDs derived from that guest UUID. Account APIs remain auth-only.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase service-role server routes, Vitest.

**Status:** Implemented and merged. No Supabase migration was required for the temporary guest slice because the real wardrobe/avatar tables already carry text owner IDs and the service routes already write owner-prefixed storage paths.

---

### Task 1: Guest Session Helpers

**Files:**
- Modify: `src/features/account/accountSession.ts`
- Modify: `src/features/account/accountApiClient.ts`
- Test: `src/features/account/accountSession.test.ts`
- Test: `src/features/account/accountApiClient.test.ts`

- [x] Add constants for `X-Wearabouts-Guest-Id`, strict UUID validation, and deterministic guest owner IDs.
- [x] Add `allowGuest` to `requireAccountSession`; when enabled and no bearer token exists, return guest `circleId` and `profileId`.
- [x] Make wardrobe fetch helpers send an auth bearer when available, otherwise send a guest UUID header.
- [x] Keep account status and onboarding calls bearer-only.

### Task 2: Wardrobe And Avatar Routes

**Files:**
- Modify all real wardrobe/avatar API routes under `app/api/wardrobe/**/route.ts`
- Test: `src/features/wardrobe/real/wardrobeApiRoutes.test.ts`

- [x] Pass `{ allowGuest: true }` to `requireAccountSession` in real wardrobe/avatar routes.
- [x] Keep account routes unchanged.
- [x] Add tests showing unauthenticated wardrobe/avatar profile requests with a guest header reach route ownership instead of returning 401.
- [x] Add tests showing no bearer and no guest header still returns 401.

### Task 3: Client Real Flows

**Files:**
- Modify: `app/upload/page.tsx`
- Modify: `app/processing/[jobId]/page.tsx`
- Modify: `app/avatar/page.tsx`
- Modify: `src/features/wardrobe/state/WardrobeContext.tsx`
- Modify: `src/features/wardrobe/components/AvatarSetupFlow.tsx`

- [x] Replace auth-only fetch calls for wardrobe/avatar work with the guest-capable helper.
- [x] Keep login/onboarding/settings auth-only.
- [x] Ensure real mode upload, processing polling, review actions, closet loading, avatar upload URL creation, avatar profile persistence, render listing, rendering, and render deletion all use the same guest header when no user is signed in.

### Task 4: Verification

**Files:**
- No production file changes expected.

- [x] Run `npm run test`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Explain that no Supabase migration is required because existing owner columns are text and service-role routes already write owner-prefixed storage paths.
