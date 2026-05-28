# Avatar Direct Supabase Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Avatar Studio setup from base64 JSON uploads to signed direct uploads into private Supabase Storage.

**Architecture:** The browser requests signed upload slots from a small Next.js API route, uploads original face/body files directly to the private `avatar-assets` bucket, then saves only asset metadata in `avatar_profiles`. Profile API responses stay metadata-only, and avatar rendering resolves signed reference URLs server-side before calling OpenAI.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Storage signed upload URLs, Vitest, existing AvatarPersistence and wardrobe state.

---

## Files

- Create: `app/api/wardrobe/avatar/upload-url/route.ts`
- Create: `src/features/wardrobe/avatar/avatarUploadSlot.ts`
- Create: `src/features/wardrobe/avatar/avatarUploadSlot.test.ts`
- Modify: `src/features/wardrobe/avatar/avatarPersistence.ts`
- Modify: `src/features/wardrobe/avatar/avatarTypes.ts`
- Modify: `src/features/wardrobe/components/AvatarSetupFlow.tsx`
- Modify: `app/avatar/page.tsx`
- Modify: `app/api/wardrobe/avatar/profile/route.ts`
- Keep: `src/features/wardrobe/avatar/avatarProfileResponse.ts`
- Keep: `src/features/wardrobe/avatar/avatarRenderProvider.ts`
- Remove or stop using: `src/features/wardrobe/avatar/avatarUploadPayload.ts`

## Task 1: Signed Upload Slot Contract

**Files:**

- Create: `src/features/wardrobe/avatar/avatarUploadSlot.ts`
- Create: `src/features/wardrobe/avatar/avatarUploadSlot.test.ts`

- [ ] **Step 1: Write the failing slot test**

```ts
import { describe, expect, it } from "vitest";
import { createAvatarUploadSlot, isSupportedAvatarUploadContentType } from "./avatarUploadSlot";

describe("avatarUploadSlot", () => {
  it("accepts only supported avatar image content types", () => {
    expect(isSupportedAvatarUploadContentType("image/jpeg")).toBe(true);
    expect(isSupportedAvatarUploadContentType("image/png")).toBe(true);
    expect(isSupportedAvatarUploadContentType("image/webp")).toBe(true);
    expect(isSupportedAvatarUploadContentType("image/gif")).toBe(false);
  });

  it("creates stable private storage metadata for an avatar input", () => {
    const slot = createAvatarUploadSlot({
      householdId: "demo-household",
      profileId: "profile-aankur",
      kind: "face",
      contentType: "image/jpeg",
      token: "fixed-token",
    });

    expect(slot).toEqual({
      assetId: "avatar-face-fixed-token",
      bucket: "avatar-assets",
      contentType: "image/jpeg",
      storagePath: "demo-household/profile-aankur/avatar-face-fixed-token.jpg",
    });
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm run test -- src/features/wardrobe/avatar/avatarUploadSlot.test.ts
```

Expected: fail because `avatarUploadSlot.ts` does not exist.

- [ ] **Step 3: Implement upload slot helpers**

```ts
import type { AvatarInputKind } from "./avatarTypes";

export const AVATAR_STORAGE_BUCKET = "avatar-assets";
export type AvatarUploadContentType = "image/jpeg" | "image/png" | "image/webp";

export interface AvatarUploadSlot {
  assetId: string;
  bucket: typeof AVATAR_STORAGE_BUCKET;
  contentType: AvatarUploadContentType;
  storagePath: string;
}

const extensions: Record<AvatarUploadContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isSupportedAvatarUploadContentType(value: string): value is AvatarUploadContentType {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp";
}

export function createAvatarUploadSlot(input: {
  householdId: string;
  profileId: string;
  kind: AvatarInputKind;
  contentType: AvatarUploadContentType;
  token: string;
}): AvatarUploadSlot {
  const assetId = `avatar-${input.kind}-${input.token}`;
  return {
    assetId,
    bucket: AVATAR_STORAGE_BUCKET,
    contentType: input.contentType,
    storagePath: `${input.householdId}/${input.profileId}/${assetId}.${extensions[input.contentType]}`,
  };
}
```

- [ ] **Step 4: Run the slot test**

Run:

```bash
npm run test -- src/features/wardrobe/avatar/avatarUploadSlot.test.ts
```

Expected: pass.

## Task 2: Signed Upload URL API

**Files:**

- Create: `app/api/wardrobe/avatar/upload-url/route.ts`
- Modify: `src/features/wardrobe/avatar/avatarPersistence.ts`

- [ ] **Step 1: Add persistence method**

Add this method to `AvatarPersistence`:

```ts
async createUploadUrl(input: AvatarUploadSlot): Promise<{ signedUrl: string; token: string }> {
  const { data, error } = await this.supabase.storage.from(input.bucket).createSignedUploadUrl(input.storagePath);
  if (error) {
    throw new Error(error.message);
  }

  return { signedUrl: data.signedUrl, token: data.token };
}
```

Also import `AvatarUploadSlot`.

- [ ] **Step 2: Create the route**

Implement `POST /api/wardrobe/avatar/upload-url`:

```ts
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AvatarPersistence } from "@/src/features/wardrobe/avatar/avatarPersistence";
import { createAvatarUploadSlot, isSupportedAvatarUploadContentType } from "@/src/features/wardrobe/avatar/avatarUploadSlot";
import type { AvatarInputKind } from "@/src/features/wardrobe/avatar/avatarTypes";
import { REAL_HOUSEHOLD_ID, REAL_PROFILE_ID } from "@/src/features/wardrobe/real/realWardrobeConfig";
import { createSupabaseServiceClient } from "@/src/features/wardrobe/real/supabaseServerClient";

function isAvatarInputKind(value: string): value is AvatarInputKind {
  return value === "face" || value === "body";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { kind?: string; contentType?: string };
    if (!payload.kind || !isAvatarInputKind(payload.kind)) {
      return NextResponse.json({ error: "Expected avatar input kind face or body." }, { status: 400 });
    }
    if (!payload.contentType || !isSupportedAvatarUploadContentType(payload.contentType)) {
      return NextResponse.json({ error: "Expected PNG, JPEG, or WebP avatar photo." }, { status: 400 });
    }

    const slot = createAvatarUploadSlot({
      householdId: REAL_HOUSEHOLD_ID,
      profileId: REAL_PROFILE_ID,
      kind: payload.kind,
      contentType: payload.contentType,
      token: randomUUID(),
    });
    const upload = await new AvatarPersistence(createSupabaseServiceClient()).createUploadUrl(slot);

    return NextResponse.json({ ...slot, signedUrl: upload.signedUrl, token: upload.token });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create avatar upload URL." }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: pass.

## Task 3: Metadata-Only Avatar Profile Persistence

**Files:**

- Modify: `src/features/wardrobe/avatar/avatarTypes.ts`
- Modify: `src/features/wardrobe/avatar/avatarPersistence.ts`
- Modify: `app/api/wardrobe/avatar/profile/route.ts`

- [ ] **Step 1: Add profile-save metadata type**

Add to `avatarTypes.ts`:

```ts
export interface AvatarStoredInput {
  assetId: string;
  storagePath: string;
  contentType: "image/png" | "image/jpeg" | "image/webp";
}
```

- [ ] **Step 2: Replace base64 profile upsert**

Change `AvatarPersistence.upsertProfile` to accept:

```ts
{
  profileId: AvatarProfile["profileId"];
  face: AvatarStoredInput;
  body: AvatarStoredInput;
  faceQuality: AvatarInputQualityCheck;
  bodyQuality: AvatarInputQualityCheck;
}
```

Remove `dataUrlToBytes` use from profile saving. Keep `dataUrlToBytes` only for generated render persistence, where the OpenAI provider still returns a data URL internally.

- [ ] **Step 3: Update profile route payload**

Change `POST /api/wardrobe/avatar/profile` to read:

```ts
{
  face: AvatarStoredInput;
  body: AvatarStoredInput;
  faceQuality: AvatarInputQualityCheck;
  bodyQuality: AvatarInputQualityCheck;
}
```

Pass those values into `upsertProfile`. Keep `toAvatarProfileResponse(profile)` on both GET and POST.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm run test -- src/features/wardrobe/avatar/avatarProfileResponse.test.ts
```

Expected: pass.

## Task 4: Browser Direct Upload Flow

**Files:**

- Modify: `src/features/wardrobe/components/AvatarSetupFlow.tsx`
- Modify: `src/features/wardrobe/state/WardrobeContext.tsx`
- Modify: `src/features/wardrobe/state/avatarReducer.ts`
- Modify: `app/avatar/page.tsx`

- [ ] **Step 1: Keep local object URLs for preview only**

In `AvatarSetupFlow`, replace data URL reading with:

```ts
const previewUrl = URL.createObjectURL(file);
```

Do not base64 encode avatar photos.

- [ ] **Step 2: Add direct upload helper**

In `AvatarSetupFlow`, implement:

```ts
async function uploadAvatarInput(kind: AvatarInputKind, file: File) {
  const slotResponse = await fetch("/api/wardrobe/avatar/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType: file.type }),
  });
  if (!slotResponse.ok) {
    throw new Error("Could not prepare avatar upload.");
  }
  const slot = (await slotResponse.json()) as {
    assetId: string;
    storagePath: string;
    contentType: "image/jpeg" | "image/png" | "image/webp";
    token: string;
  };

  const uploadResponse = await fetch(slot.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("Could not upload avatar photo.");
  }

  return slot;
}
```

- [ ] **Step 3: Store uploaded metadata in avatar state**

Extend avatar reducer actions to keep `pendingFaceStoragePath`, `pendingBodyStoragePath`, `pendingFaceContentType`, and `pendingBodyContentType`. The preview URL remains browser-local only.

- [ ] **Step 4: Save metadata-only profile**

In `app/avatar/page.tsx`, replace `faceDataUrl` and `bodyDataUrl` with:

```ts
face: {
  assetId: avatarState.pendingFaceAssetId,
  storagePath: avatarState.pendingFaceStoragePath,
  contentType: avatarState.pendingFaceContentType,
},
body: {
  assetId: avatarState.pendingBodyAssetId,
  storagePath: avatarState.pendingBodyStoragePath,
  contentType: avatarState.pendingBodyContentType,
},
```

Return early if any metadata field is missing.

- [ ] **Step 5: Remove compression workaround**

Delete `src/features/wardrobe/avatar/avatarUploadPayload.ts` and `src/features/wardrobe/avatar/avatarUploadPayload.test.ts`. Remove imports and helper functions from `AvatarSetupFlow.tsx`.

## Task 5: Verification

**Files:**

- All files touched above.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm run test -- src/features/wardrobe/avatar/avatarUploadSlot.test.ts src/features/wardrobe/avatar/avatarProfileResponse.test.ts src/features/wardrobe/avatar/avatarRenderProvider.test.ts src/features/wardrobe/state/avatarReducer.test.ts src/features/wardrobe/components/AvatarSetupFlow.test.tsx
```

Expected: all targeted tests pass.

- [ ] **Step 2: Run repo checks**

Run:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 3: Manual payload check**

In production/dev tools, verify the request body to `/api/wardrobe/avatar/profile` contains only asset IDs, storage paths, content types, and quality metadata. It must not contain `data:image/`, `base64`, `faceDataUrl`, or `bodyDataUrl`.
