# Wearabouts Phase 8 Avatar Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional Avatar Studio that generates high-quality full-body studio previews for saved Mixer/Stylist looks using a face reference, body reference, and selected wardrobe item images.

**Architecture:** Add a focused `src/features/wardrobe/avatar/` layer with typed avatar profiles, validation, render requests, cache keys, provider interfaces, demo provider, and real-provider adapter. Saved-look UI calls the avatar layer through narrow actions; Mixer, Stylist, and outfit-board rendering remain independent and continue to work without avatar setup.

**Tech Stack:** Next.js App Router, React, TypeScript, existing wardrobe context/reducers, existing closet assets, Vitest, React Testing Library, Supabase-backed real asset storage where practical, OpenAI image edit/reference workflow for the real provider behind an explicit action and feature/config gate.

## Implementation Status

Implemented on `codex/phase8-avatar-studio`:

- Avatar domain types, reducer state, validation, render request, prompt, and cache-key services.
- Demo/dev deterministic avatar render provider with no AI spend.
- Real OpenAI avatar render provider behind `NEXT_PUBLIC_TRAVOGUE_MODE=real`, `WEARABOUTS_AVATAR_REAL_RENDER_ENABLED=true`, and OpenAI avatar model config.
- `/avatar?savedOutfitId=...` setup and render flow launched only from saved looks.
- Supabase-backed `avatar-assets`, `avatar_profiles`, and `avatar_renders` persistence for saved avatar references and rendered avatar outputs.
- Avatar face/body setup uses signed direct uploads to the private Supabase `avatar-assets` bucket; profile APIs persist metadata only and avoid Vercel function payload limits.
- Cache lookup before paid rendering; explicit regenerate bypasses cache and remains limited by the reducer.
- Soft delete for avatar renders: deleted renders remain in the library record and storage.
- Stylist avatar render gallery for saved and deleted renders.
- Outfit-board fallback remains available, now as a non-overlapping flat-lay board rather than a fake body overlay.
- Compact Avatar Studio UI with subtle runtime mode indicator and no automatic render on page load.

Manual real-mode benchmark captured on 2026-05-28:

- `gpt-image-2`, `1024x1536`, `medium`, 6 references, 4 wardrobe items.
- Estimated output cost: `$0.041`.
- Input tokens: `7,226` (`7,000` image, `226` text).
- Output tokens: `1,372`.
- Total tokens: `8,598`.
- Reference prep latency: about `1.4s`.
- Provider latency: about `82.6s`.
- Route latency: about `84.9s`.
- Output image bytes: `1,878,954`.
- Cache hit verified afterward in about `300ms` with no OpenAI call.

Production payload fix captured on 2026-05-28:

- Vercel returned `FUNCTION_PAYLOAD_TOO_LARGE` when avatar setup/profile traffic could carry large base64 image data.
- The long-term fix is signed direct upload to private Supabase Storage, not client-side image compression.
- `/api/wardrobe/avatar/upload-url` returns one signed upload slot for a face/body input.
- The browser uploads the original file directly to Supabase Storage, then `/api/wardrobe/avatar/profile` saves only asset IDs, storage paths, content types, and quality metadata.
- `/api/wardrobe/avatar/profile` responses remain metadata-only.
- `/api/wardrobe/avatar/render` resolves short-lived signed face/body reference URLs server-side before calling OpenAI.
- This preserves original avatar reference quality while keeping serverless payloads small.

---

## Required Reading

Before implementation, read:

- `AGENTS.md`
- `docs/product/PROJECT_CONTEXT.md`
- `docs/product/specs/2026-05-26-travogue-mvp-design.md`
- `docs/superpowers/specs/2026-05-27-phase6-smart-mixer-outfit-engine-design.md`
- `docs/product/plans/2026-05-27-phase-6-smart-mixer-outfit-engine.md`
- `docs/superpowers/specs/2026-05-28-phase7-daily-stylist-design.md`
- `docs/product/plans/2026-05-28-phase-7-daily-stylist.md`
- `docs/superpowers/specs/2026-05-28-phase8-avatar-studio-design.md`
- `docs/product/mockups/2026-05-28-avatar-studio-flow.html`

## Locked Scope

Build:

- Avatar domain types.
- Avatar reducer/state slice.
- Avatar setup flow for face pic, body pic, and review.
- Deterministic avatar input validation with provider-ready quality result shapes.
- Saved-look handoff from existing saved looks to Avatar Studio.
- Avatar render request and cache-key services.
- Demo avatar render provider with deterministic fixture output.
- Real avatar provider interface and API route shape.
- Optional real OpenAI image render wiring behind explicit config.
- One canonical studio pose.
- Render states: setup missing, ready to render, rendering, ready, failed, cached.
- Regenerate/delete controls in the avatar preview UI.
- Outfit-board fallback at every failure point.

Do not build:

- Avatar generation while browsing Mixer or Stylist.
- Live body try-on.
- CSS garment overlays on a body photo.
- Video.
- Travel/location backgrounds.
- Shopping links.
- Multiple pose packs.
- Automatic rendering for all saved looks.
- Body measurement or sizing extraction.
- Persistent personalization/wear-memory signals.
- Broad saved-outfit refactors unrelated to avatar handoff.

## Product Quality Bar

Avatar output should be:

- Full body, head to shoes visible.
- Neutral light studio background.
- Realistic fashion-catalog styling.
- Recognizably based on the user, but not optimized for passport-photo identity precision.
- Lightly polished like a realistic studio photo, without face slimming, filter-like smoothing, age changes, or identity drift.
- Natural head-to-body scale, avoiding an oversized head or enlarged face.
- Faithful to selected outfit categories, colors, patterns, and silhouettes.
- Good enough to answer: `Does this outfit work on me?`

Keep cost low by rendering rarely and caching aggressively, not by lowering final output quality.

## File Structure

Create:

```text
app/avatar/page.tsx
app/api/wardrobe/avatar/render/route.ts
src/features/wardrobe/avatar/avatarTypes.ts
src/features/wardrobe/avatar/avatarValidation.ts
src/features/wardrobe/avatar/avatarValidation.test.ts
src/features/wardrobe/avatar/avatarRenderCacheKey.ts
src/features/wardrobe/avatar/avatarRenderCacheKey.test.ts
src/features/wardrobe/avatar/avatarRenderPrompt.ts
src/features/wardrobe/avatar/avatarRenderPrompt.test.ts
src/features/wardrobe/avatar/avatarRenderRequest.ts
src/features/wardrobe/avatar/avatarRenderRequest.test.ts
src/features/wardrobe/avatar/avatarRenderProvider.ts
src/features/wardrobe/avatar/demoAvatarRenderProvider.ts
src/features/wardrobe/avatar/demoAvatarRenderProvider.test.ts
src/features/wardrobe/avatar/realAvatarRenderProvider.ts
src/features/wardrobe/avatar/realAvatarRenderProvider.test.ts
src/features/wardrobe/components/AvatarSetupFlow.tsx
src/features/wardrobe/components/AvatarSetupFlow.test.tsx
src/features/wardrobe/components/AvatarInputReview.tsx
src/features/wardrobe/components/AvatarRenderPanel.tsx
src/features/wardrobe/components/AvatarRenderPanel.test.tsx
src/features/wardrobe/state/avatarReducer.ts
src/features/wardrobe/state/avatarReducer.test.ts
```

Modify:

```text
src/domain/wardrobe.ts
src/features/wardrobe/state/WardrobeContext.tsx
src/features/wardrobe/components/SavedOutfitList.tsx
app/closet/page.tsx
app/stylist/page.tsx
```

Optional, only if needed for real persistence:

```text
src/features/wardrobe/real/supabaseRealAssetStorage.ts
src/features/wardrobe/real/supabaseRealWardrobeRepository.ts
src/features/wardrobe/real/realWardrobeConfig.ts
```

Do not modify core outfit scoring unless avatar-specific metadata exposes a real type mismatch.

## Implementation Tasks

### Task 1: Add Avatar Domain Types

**Files:**

- Modify: `src/domain/wardrobe.ts`
- Create: `src/features/wardrobe/avatar/avatarTypes.ts`

- [ ] **Step 1: Add stable domain types**

Add avatar-specific types without changing existing saved outfit behavior:

```ts
export type AvatarInputKind = "face" | "body";

export type AvatarInputQualityStatus = "pending" | "passed" | "warning" | "failed";

export interface AvatarInputQualityCheck {
  status: AvatarInputQualityStatus;
  reasons: string[];
  detectedPersonCount?: number;
  faceVisible?: boolean;
  fullBodyVisible?: boolean;
}

export interface AvatarProfile {
  id: string;
  profileId: WardrobeProfileId;
  faceAssetId: string;
  bodyAssetId: string;
  faceQuality: AvatarInputQualityCheck;
  bodyQuality: AvatarInputQualityCheck;
  createdAtIso: string;
  updatedAtIso: string;
}

export type AvatarPoseId = "studio-front" | "studio-three-quarter";
export type AvatarRenderQuality = "draft" | "final";

export interface AvatarRenderRequest {
  avatarProfileId: string;
  savedOutfitId: string;
  wardrobeItemIds: string[];
  poseId: AvatarPoseId;
  quality: AvatarRenderQuality;
  promptVersion: string;
}

export interface AvatarRender {
  id: string;
  request: AvatarRenderRequest;
  status: "queued" | "rendering" | "ready" | "failed";
  imageAssetId?: string;
  imageUrl?: string;
  qualityNotes: string[];
  createdAtIso: string;
  updatedAtIso?: string;
}
```

- [ ] **Step 2: Keep avatar details isolated**

If `src/domain/wardrobe.ts` starts feeling crowded, export the concrete avatar types from `avatarTypes.ts` and keep only cross-feature references in the domain file. Prefer the smallest change that preserves type clarity.

- [ ] **Step 3: Verify**

Run:

```bash
npm run typecheck
```

### Task 2: Add Avatar Reducer With TDD

**Files:**

- Create: `src/features/wardrobe/state/avatarReducer.test.ts`
- Create: `src/features/wardrobe/state/avatarReducer.ts`
- Modify: `src/features/wardrobe/state/WardrobeContext.tsx`

- [ ] **Step 1: Write reducer tests**

Cover:

- Initial state has no avatar profile and no renders.
- Face quality can be stored.
- Body quality can be stored.
- Avatar profile can be completed.
- Render can be queued.
- Render can move to `rendering`.
- Render can move to `ready` with image URL.
- Render can move to `failed` with quality notes.
- Cached ready render can be found by cache key.
- Deleting a render removes it without deleting saved outfit.

- [ ] **Step 2: Implement reducer**

Suggested state:

```ts
export interface AvatarState {
  profile: AvatarProfile | null;
  pendingFaceAssetId: string | null;
  pendingBodyAssetId: string | null;
  renders: AvatarRender[];
}
```

Actions should be avatar-specific and not overload `mixerReducer`.

- [ ] **Step 3: Wire context narrowly**

Add to `WardrobeContextValue`:

```ts
avatarState: AvatarState;
saveAvatarInput: (kind: AvatarInputKind, assetId: string, quality: AvatarInputQualityCheck) => void;
completeAvatarProfile: (profileId: WardrobeProfileId) => void;
queueAvatarRender: (request: AvatarRenderRequest) => void;
markAvatarRenderReady: (renderId: string, imageUrl: string, imageAssetId?: string) => void;
markAvatarRenderFailed: (renderId: string, notes: string[]) => void;
deleteAvatarRender: (renderId: string) => void;
```

Keep existing wardrobe/mixer/trip context methods unchanged.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- src/features/wardrobe/state/avatarReducer.test.ts
npm run typecheck
```

### Task 3: Build Validation And Cache Services With TDD

**Files:**

- Create: `src/features/wardrobe/avatar/avatarValidation.test.ts`
- Create: `src/features/wardrobe/avatar/avatarValidation.ts`
- Create: `src/features/wardrobe/avatar/avatarRenderCacheKey.test.ts`
- Create: `src/features/wardrobe/avatar/avatarRenderCacheKey.ts`

- [ ] **Step 1: Write validation tests**

Test deterministic mapping for:

- Face passed.
- Face failed because no face.
- Face warning because low light or blur.
- Body passed.
- Body failed because full body is missing.
- Body failed because multiple people.
- Body warning because pose angle is imperfect but usable.

The first implementation can accept manually supplied detection facts so UI and provider code can share the same quality result shape.

- [ ] **Step 2: Implement validation helpers**

Do not add expensive AI validation in this step. Create pure helpers such as:

```ts
evaluateFaceInput(facts: AvatarFaceValidationFacts): AvatarInputQualityCheck;
evaluateBodyInput(facts: AvatarBodyValidationFacts): AvatarInputQualityCheck;
canCompleteAvatarProfile(face: AvatarInputQualityCheck, body: AvatarInputQualityCheck): boolean;
```

- [ ] **Step 3: Write cache-key tests**

Cover:

- Same wardrobe items in different order produce the same key.
- Different pose produces a different key.
- Different prompt version produces a different key.
- Different quality produces a different key.

- [ ] **Step 4: Implement cache key**

Use a stable string key:

```text
avatar:<profileId>:outfit:<savedOutfitId>:items:<sortedIds>:pose:<poseId>:quality:<quality>:prompt:<promptVersion>
```

If this grows too long for storage later, hash it at the repository boundary, not inside the domain service.

- [ ] **Step 5: Verify**

Run:

```bash
npm run test -- src/features/wardrobe/avatar/avatarValidation.test.ts src/features/wardrobe/avatar/avatarRenderCacheKey.test.ts
npm run typecheck
```

### Task 4: Build Render Request And Prompt Services With TDD

**Files:**

- Create: `src/features/wardrobe/avatar/avatarRenderRequest.test.ts`
- Create: `src/features/wardrobe/avatar/avatarRenderRequest.ts`
- Create: `src/features/wardrobe/avatar/avatarRenderPrompt.test.ts`
- Create: `src/features/wardrobe/avatar/avatarRenderPrompt.ts`

- [ ] **Step 1: Write render request tests**

Cover:

- Creates request from a saved outfit.
- Excludes null outfit slots.
- Preserves profile and saved outfit id.
- Defaults to `studio-three-quarter` and `final`.
- Throws or returns failure when avatar profile is missing.
- Throws or returns failure when saved outfit has no wardrobe items.

- [ ] **Step 2: Implement request builder**

Keep the builder pure:

```ts
createAvatarRenderRequest({
  avatarProfile,
  savedOutfit,
  poseId,
  quality,
  promptVersion,
})
```

- [ ] **Step 3: Write prompt tests**

Cover that the prompt:

- Requests full body.
- Requests neutral studio background.
- Requests recognizable likeness and body proportions.
- Prioritizes outfit quality.
- Includes item names/categories/colors/patterns when available.
- Forbids extra core garments.
- Forbids cropped head or feet.

- [ ] **Step 4: Implement prompt builder**

Use a versioned constant:

```ts
export const AVATAR_RENDER_PROMPT_VERSION = "avatar-studio-v1.1";
```

Keep prompts deterministic. Do not concatenate raw user notes into the prompt in Phase 8.

- [ ] **Step 5: Verify**

Run:

```bash
npm run test -- src/features/wardrobe/avatar/avatarRenderRequest.test.ts src/features/wardrobe/avatar/avatarRenderPrompt.test.ts
npm run typecheck
```

### Task 5: Add Demo Avatar Provider

**Files:**

- Create: `src/features/wardrobe/avatar/avatarRenderProvider.ts`
- Create: `src/features/wardrobe/avatar/demoAvatarRenderProvider.test.ts`
- Create: `src/features/wardrobe/avatar/demoAvatarRenderProvider.ts`

- [ ] **Step 1: Define provider contract**

```ts
export interface AvatarRenderProvider {
  renderAvatar(request: AvatarRenderProviderRequest): Promise<AvatarRenderProviderResult>;
}
```

The provider request should include:

- Avatar profile.
- Saved outfit.
- Resolved wardrobe items.
- Prompt text.
- Pose id.
- Quality.

- [ ] **Step 2: Add demo tests**

Cover:

- Demo provider returns a ready deterministic render.
- Demo provider includes a mock `imageUrl` or visual token.
- Demo provider does not require network.
- Demo provider can simulate failed validation when requested.

- [ ] **Step 3: Implement demo provider**

Use a deterministic CSS-friendly or local fixture-style output. Do not call OpenAI in the demo provider.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- src/features/wardrobe/avatar/demoAvatarRenderProvider.test.ts
npm run typecheck
```

### Task 6: Build Avatar Setup UI

**Files:**

- Create: `app/avatar/page.tsx`
- Create: `src/features/wardrobe/components/AvatarSetupFlow.tsx`
- Create: `src/features/wardrobe/components/AvatarSetupFlow.test.tsx`
- Create: `src/features/wardrobe/components/AvatarInputReview.tsx`

- [ ] **Step 1: Write component tests**

Cover:

- Starts on face step when no face input exists.
- Moves to body step after face input is accepted.
- Shows warnings and failed states.
- Review screen shows both references.
- `Finish` is disabled until minimum quality passes.
- Swap returns user to the relevant step.

- [ ] **Step 2: Implement setup flow**

Use the mockup as product reference:

- `Face Pic`
- `Body Pic`
- `Your Avatar`

The first implementation may use file inputs and local preview URLs. Real upload storage can be added in the real persistence task.

- [ ] **Step 3: Keep route tabless**

Do not add Avatar to bottom nav. It is launched from saved looks.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- src/features/wardrobe/components/AvatarSetupFlow.test.tsx
npm run typecheck
npm run lint
```

### Task 7: Add Saved-Look Avatar Handoff

**Files:**

- Modify: `src/features/wardrobe/components/SavedOutfitList.tsx`
- Modify: `app/closet/page.tsx`
- Modify: `app/stylist/page.tsx`

- [ ] **Step 1: Write or update component tests**

Cover:

- Saved outfit list shows `Render avatar preview`.
- Button links to `/avatar?savedOutfitId=<id>`.
- Existing saved outfit count and labels remain.
- Empty saved outfit state is unchanged.

- [ ] **Step 2: Implement handoff**

Add the avatar action only where saved outfits are displayed or immediately after Stylist save confirmation.

Do not change the behavior of `Save`, `Pass`, `Refine`, Mixer paging, or Stylist result navigation.

- [ ] **Step 3: Verify**

Run:

```bash
npm run test -- src/features/wardrobe/components/SavedOutfitList.test.tsx src/features/wardrobe/components/StylistLookCard.test.tsx
npm run typecheck
npm run lint
```

If `SavedOutfitList.test.tsx` does not exist yet, create it with the new coverage.

### Task 8: Build Avatar Render Panel

**Files:**

- Create: `src/features/wardrobe/components/AvatarRenderPanel.tsx`
- Create: `src/features/wardrobe/components/AvatarRenderPanel.test.tsx`
- Modify: `app/avatar/page.tsx`

- [ ] **Step 1: Write panel tests**

Cover:

- Missing avatar profile shows setup prompt.
- Ready-to-render state shows saved outfit and selected items.
- Rendering state shows progress and outfit-board fallback.
- Ready state shows generated preview and regenerate/delete controls.
- Failed state shows fallback and retry if allowed.
- Cached render shows immediately.

- [ ] **Step 2: Implement render panel**

Render states:

```text
setup_missing
ready_to_render
rendering
ready
failed
cached_ready
```

Use existing outfit-board visual components where possible. Avoid duplicating board rendering logic.

- [ ] **Step 3: Add demo render action**

Wire `Generate preview` to demo provider first. The output can be a deterministic styled preview or fixture-style asset, but the state flow must match the real pipeline.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- src/features/wardrobe/components/AvatarRenderPanel.test.tsx
npm run typecheck
npm run lint
```

### Task 9: Add Real Provider And API Route Behind Config

**Files:**

- Create: `src/features/wardrobe/avatar/realAvatarRenderProvider.test.ts`
- Create: `src/features/wardrobe/avatar/realAvatarRenderProvider.ts`
- Create: `app/api/wardrobe/avatar/render/route.ts`
- Modify: `src/features/wardrobe/real/realWardrobeConfig.ts`

- [ ] **Step 1: Add config**

Suggested env/config:

```text
OPENAI_AVATAR_IMAGE_MODEL=gpt-image-2
OPENAI_AVATAR_IMAGE_SIZE=1024x1536
OPENAI_AVATAR_IMAGE_QUALITY=high
WEARABOUTS_AVATAR_REAL_RENDER_ENABLED=false
```

Keep real rendering disabled unless explicitly configured.

- [ ] **Step 2: Write provider tests with mocked client**

Cover:

- Sends face, body, and wardrobe item images as references.
- Uses configured model, size, and quality.
- Includes prompt text from the prompt builder.
- Maps provider success to `AvatarRender`.
- Maps provider errors to a failed result without throwing through the UI boundary.
- Does not call provider when real render flag is off.

- [ ] **Step 3: Implement route shape**

Request body:

```ts
{
  savedOutfitId: string;
  poseId?: AvatarPoseId;
  quality?: AvatarRenderQuality;
}
```

The route should:

1. Resolve avatar profile.
2. Resolve saved outfit.
3. Resolve wardrobe item assets.
4. Check cache.
5. If cached, return cached render.
6. If not cached and real render is enabled, call provider.
7. Store output asset.
8. Return render status.

For the first real wiring, it is acceptable to support only the current profile and existing real asset storage path if auth/household persistence is still limited.

- [ ] **Step 4: Add quality validation hook**

After provider output, run a first-pass validation hook. If full validation is not ready, record `qualityNotes` and keep the UI honest. Do not claim failed images are ready.

- [ ] **Step 5: Verify**

Run:

```bash
npm run test -- src/features/wardrobe/avatar/realAvatarRenderProvider.test.ts
npm run typecheck
npm run lint
```

### Task 10: Persistence And Cache Integration

**Files:**

- Modify only the existing real repository/storage files needed by the chosen persistence approach.

- [ ] **Step 1: Inspect current Supabase schema and repository behavior**

Before editing persistence code, inspect:

- Closet asset storage buckets.
- Wardrobe item asset mapping.
- Saved outfit persistence status.
- Existing API route patterns.

- [ ] **Step 2: Choose the smallest persistence path**

Preferred first approach:

- Store avatar source images as closet/source assets where compatible.
- Store render output as a closet asset or avatar-specific asset record if schema already supports it cleanly.
- Keep local reducer state for demo mode.

Avoid broad schema churn unless saved outfit/avatar persistence truly requires it.

- [ ] **Step 3: Add cache lookup**

Use the stable cache key service. Cache should prevent repeat spend for the same:

- Avatar profile.
- Saved outfit / item signature.
- Pose.
- Quality.
- Prompt version.

- [ ] **Step 4: Verify cached flow manually**

Generate once, revisit the same saved look, confirm no second provider call occurs.

### Task 11: Manual UX QA

- [ ] Open `docs/product/mockups/2026-05-28-avatar-studio-flow.html` and compare implemented flow against it.
- [ ] Save a Mixer look and confirm existing Mixer behavior still works.
- [ ] Save a Stylist look and confirm existing Stylist behavior still works.
- [ ] Open avatar setup from a saved look.
- [ ] Confirm face/body/review flow.
- [ ] Confirm bad body input blocks finish or shows warning.
- [ ] Confirm demo render completes.
- [ ] Confirm ready render shows regenerate/delete/fallback controls.
- [ ] Confirm delete does not delete saved outfit.
- [ ] Confirm cached render reloads.
- [ ] Confirm bottom nav is unchanged.
- [ ] Confirm no avatar render starts automatically.

### Task 12: Final Verification

Run:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass.

If real provider is wired, also run one controlled real render only after confirming:

- `WEARABOUTS_AVATAR_REAL_RENDER_ENABLED=true`
- API key/config are present.
- A saved outfit exists.
- Avatar inputs pass validation.
- The generated render is cached after completion.

## Commit Plan

Keep commits small:

1. `Add avatar domain and reducer`
2. `Add avatar validation and render request services`
3. `Add avatar setup flow`
4. `Add saved-look avatar handoff`
5. `Add demo avatar render panel`
6. `Add gated real avatar render provider`
7. `Persist and cache avatar renders`

Do not squash unrelated fixes into avatar commits.

## Risk Controls

- Keep avatar tabless so navigation does not disrupt the current product.
- Keep avatar state separate from mixer/trip/stylist reducers.
- Use provider contracts so demo mode and real mode share the same UI.
- Keep real generation behind an explicit flag.
- Cache before showing regenerate as a habit-forming action.
- Preserve outfit-board fallback everywhere.
- Run full checks before claiming completion.
