# Phase 8 Avatar Studio Design

## Summary

Phase 8 adds an optional Avatar Studio for saved Wearabouts looks. The user uploads a face photo and a full-body photo once, then asks Wearabouts to generate a clean full-body studio render for a saved Mixer or Stylist outfit.

The goal is not live try-on during browsing. The goal is a high-quality "does this look good on me?" preview after the user has already chosen a look worth rendering.

The visual quality target is similar to the provided Alta Daily references:

- Full-body fashion-catalog render.
- Clean light gray or white studio background.
- Realistic body proportions and recognizable likeness.
- Very subtle studio-photo polish while preserving the same facial structure, age, skin tone, hairstyle, facial hair, and expression.
- Natural head-to-body scale without an oversized head or enlarged face.
- Styled outfit that looks naturally worn, not pasted on.
- Simple regenerate/delete controls.

## Locked Product Decisions

- Phase name: `Avatar Studio`.
- Avatar renders are generated only for saved looks.
- No avatar generation while swiping Mixer or browsing Stylist recommendations.
- Optimize for outfit quality plus recognizable likeness, not passport-photo identity precision.
- Start with one or two fixed studio poses.
- Use the user's face photo for likeness and full-body photo for body proportions.
- Use selected wardrobe item images as clothing references.
- Use high-quality generation for final renders.
- Cache every successful render.
- Regenerate only on explicit user action.
- Keep outfit-board preview as the fallback when avatar render is unavailable or fails.
- Do not fake body try-on with layered CSS overlays.

## Primary User Story

As a Wearabouts user who saved a good outfit, I want to see a polished full-body preview of myself wearing it, so I can judge whether the look works on me before wearing or packing it.

## Success Moment

1. User saves a Stylist or Mixer look.
2. The saved-look screen offers `Render avatar preview`.
3. If no avatar profile exists, Wearabouts asks for:
   - Face pic.
   - Body pic.
4. Wearabouts validates both photos before spending render cost.
5. User reviews and confirms the avatar inputs.
6. Wearabouts generates one clean studio render of the saved look.
7. The successful render is saved automatically; the user can regenerate, delete, open saved renders, or return to the outfit board.

## Non-Goals

Phase 8 does not build:

- Live avatar try-on inside Mixer.
- Photoreal generation for every recommendation.
- Video.
- Multiple fashion-editorial environments.
- Travel/location backdrops.
- Social sharing.
- Shopping try-on.
- Perfect garment fidelity guarantees.
- Full 3D avatar modeling.
- Body measurement extraction for sizing.
- Automatic avatar rendering for all saved looks.

## Experience Design

### Entry Points

Avatar Studio should appear only when it has a meaningful job:

- Saved Stylist look confirmation.
- Saved Mixer look detail.
- Closet saved-look section.

Primary action:

```text
Render avatar preview
```

If avatar setup is incomplete, the action opens setup. If setup exists, it starts a render confirmation screen.

### Avatar Setup Flow

The setup flow has three steps:

1. `Face Pic`
2. `Body Pic`
3. `Review Your Avatar`

#### Face Pic

Purpose:

- Capture recognizable facial identity.
- Improve consistency across renders.

Guidance:

- Clear close-up.
- Face visible and well lit.
- One person.
- No sunglasses or heavy obstruction.
- Front-facing or mild angle preferred.

Allowed:

- Natural smile.
- Real-world background.
- Existing photo from camera roll.

Rejected or warned:

- Face too small.
- Face blurred.
- Multiple faces.
- Strong shadow.
- Heavy occlusion.

#### Body Pic

Purpose:

- Capture body proportions, height/width relationship, stance, and broad silhouette.

Guidance:

- Head-to-toe full body.
- One person.
- Good lighting.
- Minimal occlusion.
- Neutral or simple standing pose.
- Camera not too high or too low.

Allowed:

- Mirror photo if full body is visible.
- Existing travel/street photo if one person and body is clear.

Rejected or warned:

- Cropped feet or head.
- Seated pose.
- Selfie close-up.
- Multiple people.
- Bag or object blocking body.
- Very loose coat hiding body shape.

### Review Your Avatar

Show face and body images side by side with:

- `Swap` for each image.
- Quality status for each image.
- Short reason if a warning exists.
- `Finish` only when minimum quality passes.

The review screen should communicate:

```text
These photos help Wearabouts create avatar previews. You can update them later.
```

Do not imply that the current body-photo outfit will be used as the final outfit. The saved wardrobe look is the outfit source.

### Render Flow

After setup, the render screen should show:

- Saved outfit board.
- Selected wardrobe item names.
- Avatar profile readiness.
- Estimated state: `Ready to render`, `Rendering`, `Needs better avatar photos`, `Render failed`, `Preview ready`.

Primary render action:

```text
Generate preview
```

When preview is ready:

- Show the generated full-body image.
- Show a compact saved state and the saved-look name without repeating the full item list.
- Actions:
  - `Regenerate`
  - `Delete`
  - `View outfit board`
  - `Saved renders`

Regenerate should be explicit and rate-limited.
Normal reopen should check the cached render first. Regenerate is the only action that intentionally bypasses cache.

The outfit-board fallback should be an honest non-overlapping flat-lay board. It must not fake body try-on, and selected items should not obscure one another, especially when multiple garments are white, cream, or low contrast.

## Visual Direction

### First Pose

Use one canonical studio pose:

- Full body.
- Relaxed standing pose.
- Slight three-quarter angle or front-facing.
- Arms natural, one hand may be in pocket if appropriate.
- Feet visible.
- Head and shoes not cropped.
- Light gray or white studio background.

### Optional Second Pose

Add only after the first pose is reliable:

- Slight editorial standing pose.
- Subtle movement or weight shift.
- Still full-body and clean.

Avoid exaggerated runway poses in the first slice because they increase failure risk and make garment matching harder.

## Technical Design

### Architecture

Add an avatar layer parallel to the existing wardrobe provider structure:

```text
src/features/wardrobe/avatar/
  avatarTypes.ts
  avatarValidation.ts
  avatarUploadSlot.ts
  avatarRenderPrompt.ts
  avatarRenderCacheKey.ts
  avatarRenderProvider.ts
  demoAvatarRenderProvider.ts
  realAvatarRenderProvider.ts
```

Suggested UI components:

```text
src/features/wardrobe/components/AvatarSetupFlow.tsx
src/features/wardrobe/components/AvatarInputReview.tsx
src/features/wardrobe/components/AvatarRenderPanel.tsx
```

Suggested route:

```text
app/avatar/page.tsx
app/api/wardrobe/avatar/upload-url/route.ts
app/api/wardrobe/avatar/profile/route.ts
app/api/wardrobe/avatar/render/route.ts
```

Keep implementation details flexible when planning starts. The important boundary is that saved-look pages call an avatar provider; they should not know model or prompt details.

Avatar input media must not be sent through function JSON payloads as base64. In real mode, the setup flow requests a signed private Supabase Storage upload slot, uploads the original face/body file directly to `avatar-assets`, and then saves only metadata in the avatar profile.

### Core Types

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
  profileId: string;
  faceAssetId: string;
  bodyAssetId: string;
  faceQuality: AvatarInputQualityCheck;
  bodyQuality: AvatarInputQualityCheck;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface AvatarStoredInput {
  assetId: string;
  storagePath: string;
  contentType: "image/png" | "image/jpeg" | "image/webp";
}

export interface AvatarRenderRequest {
  avatarProfileId: string;
  savedOutfitId: string;
  wardrobeItemIds: string[];
  poseId: "studio-front" | "studio-three-quarter";
  quality: "draft" | "final";
  promptVersion: string;
}

export interface AvatarRender {
  id: string;
  request: AvatarRenderRequest;
  status: "queued" | "rendering" | "ready" | "failed";
  imageAssetId?: string;
  qualityNotes: string[];
  createdAtIso: string;
}
```

### AI Pipeline

Use a staged job pipeline:

1. Upload face/body source images directly to private Supabase Storage using signed upload URLs.
2. Run low-cost validation.
3. Store avatar profile references as metadata only.
4. Build render request from:
   - Face image.
   - Body image.
   - Saved outfit item images.
   - Outfit metadata.
   - Fixed pose prompt.
5. Generate one studio avatar image.
6. Validate generated image.
7. Store and cache the result.
8. Return preview to saved-look UI.

### Model Strategy

Use image generation/editing only when the user explicitly requests a saved-look avatar render.

The OpenAI Image API supports edit/reference workflows with multiple input images and portrait sizes such as `1024x1536`. For this product, the first real provider should use reference images for:

- Face.
- Full body.
- Outfit garments.

Use high quality for final user-facing renders. Draft quality can exist later for internal testing, but the product should not expose low-quality avatar output as the main experience.

### Prompt Strategy

Prompts should be versioned and conservative, but lightly fashion-directed enough to avoid passport-photo or corporate-headshot outputs.

Current prompt family:

```text
avatar-studio-v1.4: Create a realistic accurate studio person with a subtle fashion-catalog lift from the face and body references wearing the selected outfit items. Preserve recognizable likeness, facial structure, face shape, age, skin tone, hairstyle, facial hair, natural facial fullness, realistic body proportions, broad silhouette, shoulder width, and natural head-to-body scale while allowing a calmer, more alert composed expression if the source smile or blink looks awkward. Use a full-body 70-85mm studio catalog perspective with relaxed confident posture, slight pose asymmetry, optional hand-in-pocket styling when compatible with the outfit, visible relaxed neck, shoulders level and not rounded, one foot subtly forward or lightly crossed, generous neutral background, soft studio lighting, and a subtle floor contact shadow. Apply restrained studio polish through lighting, focus, and grooming with natural skin texture, clearer eyes, natural facial detail, tidier hair definition, cleaner neck-to-jaw separation from lighting and posture, and reduced harsh shadows; avoid beauty filters, face slimming, jaw sharpening, longer or more chiseled jaw, thinner cheeks, symmetry changes, younger-looking face, airbrushed/plastic skin, oversized head, wide-angle distortion, body slimming, body elongation, muscular reshaping, model makeover, or identity drift. Prioritize making the outfit look contemporary, naturally worn, neatly styled, properly fitted to the person's real body, and faithful to the wardrobe item colors, patterns, silhouettes, materials, and construction details. Avoid basic stiff ID-photo stance, hunched/compressed neck, dropped or rounded shoulders, awkward head tilt, limp arms, or both arms hanging straight down. If the selected outfit includes outerwear but no top, add one simple modest neutral inner layer under the outerwear so the person is not bare-chested; keep it secondary and do not replace or hide the selected outerwear. Show the entire body from head to shoes. Do not add extra clothing items except this necessary inner layer. Do not crop the head or feet.
```

Wardrobe item metadata should be included in structured text:

- Item name.
- Category.
- Primary colors.
- Pattern.
- Material guess if available.
- Styling role.

### Render Validation

Before marking a render as ready, validate:

- One full-body person is visible.
- Head and feet are not cropped.
- Face is plausible and recognizable.
- Outfit roughly matches selected item categories.
- Major colors and patterns are not badly changed.
- No extra core garments were invented.
- Hands, feet, and limbs are not obviously broken.
- Background is clean.

If validation fails:

- Store the failed render for debugging if appropriate.
- Show a retry path.
- Do not present it as a successful avatar preview.

### Caching And Cost Controls

Cache key should include:

- `avatarProfileId`
- sorted `wardrobeItemIds`
- saved outfit id or outfit signature
- pose id
- prompt version
- render quality

Cost controls:

- Render only saved looks.
- Never render during recommendation browsing.
- Reuse avatar setup inputs.
- Reuse successful cached renders.
- Limit free regenerates per outfit.
- Show regenerate as an explicit action.
- Avoid multiple pose outputs in the first slice.
- Do not generate transparent backgrounds or alternate crops unless needed.

Quality controls:

- Spend on the final render where it matters.
- Save cost by reducing frequency, not by lowering the primary output quality.
- Prefer one excellent image over several mediocre variants.

## Data And Persistence

Initial implementation can store avatar records in the same persistence layer used by real wardrobe assets.

Minimum persisted objects:

- Avatar profile.
- Face source asset reference.
- Body source asset reference.
- Avatar render job.
- Avatar render output asset.
- Render status and prompt version.

Storage contract:

- Avatar source and output images live in the private Supabase `avatar-assets` bucket.
- Setup photos are uploaded directly from the browser to Supabase with a server-created signed upload URL.
- `avatar_profiles` stores asset IDs, storage paths, content types, and quality checks, not base64 data.
- Profile GET/POST responses are metadata-only and must not include image payloads or signed source URLs.
- Render routes resolve short-lived signed face/body URLs server-side before preparing OpenAI reference images.
- Server routes validate that profile metadata points to the expected household/profile avatar path before persisting it.

This avoids Vercel's function payload ceiling, keeps the bucket private, and preserves original reference quality for controlled provider-side normalization.

Do not store derived biometric measurements in the first slice.

## Error Handling

### Avatar Input Errors

Face/body upload can fail because:

- Upload failed.
- Image too large or unsupported.
- Validation failed.
- Network/API error.

The UI should let the user swap the image and retry.

### Render Errors

Render can fail because:

- Avatar inputs are insufficient.
- Wardrobe item images are missing or low quality.
- AI provider error.
- Generated output fails validation.

The UI should show:

- Clear non-technical message.
- Outfit-board fallback.
- Retry/regenerate if allowed.

## Testing Strategy

Unit tests:

- Avatar input quality status mapping.
- Cache key generation.
- Render request creation from saved outfit.
- Prompt builder includes required references and constraints.
- Failed validation blocks ready status.

Component tests:

- Face/body setup flow.
- Review screen swap behavior.
- Saved-look render panel states.
- Cached render display.
- Failed render fallback.

Provider tests:

- Demo provider returns deterministic studio render fixture.
- Real provider maps request to API inputs without exposing provider details to UI.

Manual/visual QA:

- Good face + good body + saved outfit.
- Body image with cropped feet.
- Face image with multiple people.
- Sparse outfit missing shoes.
- Regenerate from ready render.
- Cached render reload.

Full verification before implementation completion:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## First Implementation Slice

Build the smallest useful slice:

1. Avatar setup route with face/body/review flow.
2. Validation service with deterministic checks plus provider-ready result shape.
3. Demo avatar render provider with fixed fixture output.
4. Saved-look `Render avatar preview` handoff.
5. Real render provider interface, but only wire real generation after demo flow is stable.
6. Render cache key and render status model.
7. One canonical studio pose.

The first slice should prove the product flow and state model before spending real image-generation cost.

## Open Questions To Settle Before Coding

1. Should avatar setup live as its own tabless route or as a modal launched from saved looks?
2. Should real generation be included in the first PR, or should the first PR be demo-provider-only with the real provider behind a later flag?
3. What is the regenerate allowance per saved look?
4. Should avatar renders be profile-specific for household members from day one?
5. Should the first studio pose be front-facing or slight three-quarter?
6. Should failed generated images be retained for local debugging or immediately discarded?

## Recommendation

Start with a strict setup flow and one excellent fixed studio pose. Keep cost low by rendering rarely and caching aggressively, not by lowering the quality of the image that the user actually sees.

Avatar Studio should feel like a premium payoff for saved looks, not a gimmick bolted onto every recommendation.
