import { describe, expect, it } from "vitest";
import type { AvatarRenderRequest } from "@/src/features/wardrobe/avatar/avatarTypes";
import {
  avatarReducer,
  findReadyAvatarRenderByCacheKey,
  initialAvatarState,
} from "./avatarReducer";

const passedQuality = { status: "passed" as const, reasons: [] };
const request: AvatarRenderRequest = {
  avatarProfileId: "avatar-profile-aankur",
  savedOutfitId: "outfit-1",
  wardrobeItemIds: ["shirt", "trousers"],
  poseId: "studio-three-quarter",
  quality: "final",
  promptVersion: "avatar-studio-v1",
};

describe("avatarReducer", () => {
  it("starts without an avatar profile or renders", () => {
    expect(initialAvatarState.profile).toBeNull();
    expect(initialAvatarState.renders).toEqual([]);
  });

  it("stores face and body input quality before completing a profile", () => {
    const withFace = avatarReducer(initialAvatarState, {
      type: "avatarInputSaved",
      kind: "face",
      assetId: "face-asset",
      previewUrl: "data:image/png;base64,face",
      quality: passedQuality,
      storedInput: { assetId: "face-asset", storagePath: "avatars/face.jpg", contentType: "image/jpeg" },
    });
    const withBody = avatarReducer(withFace, {
      type: "avatarInputSaved",
      kind: "body",
      assetId: "body-asset",
      previewUrl: "data:image/png;base64,body",
      quality: { status: "warning", reasons: ["Pose is slightly angled."] },
    });

    expect(withBody.pendingFaceAssetId).toBe("face-asset");
    expect(withBody.pendingFaceStoragePath).toBe("avatars/face.jpg");
    expect(withBody.pendingFaceContentType).toBe("image/jpeg");
    expect(withBody.pendingBodyQuality?.status).toBe("warning");
  });

  it("completes an avatar profile when both pending inputs exist", () => {
    const withFace = avatarReducer(initialAvatarState, {
      type: "avatarInputSaved",
      kind: "face",
      assetId: "face-asset",
      previewUrl: "face-url",
      quality: passedQuality,
    });
    const withBody = avatarReducer(withFace, {
      type: "avatarInputSaved",
      kind: "body",
      assetId: "body-asset",
      previewUrl: "body-url",
      quality: passedQuality,
    });
    const state = avatarReducer(withBody, {
      type: "avatarProfileCompleted",
      profileId: "profile-aankur",
      avatarProfileId: "avatar-profile-aankur",
      nowIso: "2026-05-28T10:00:00.000Z",
    });

    expect(state.profile).toMatchObject({
      id: "avatar-profile-aankur",
      profileId: "profile-aankur",
      faceAssetId: "face-asset",
      bodyAssetId: "body-asset",
    });
  });

  it("moves a queued render through rendering, ready, and failed states", () => {
    const queued = avatarReducer(initialAvatarState, {
      type: "avatarRenderQueued",
      renderId: "render-1",
      request,
      cacheKey: "avatar:cache-key",
      nowIso: "2026-05-28T10:00:00.000Z",
    });
    const rendering = avatarReducer(queued, { type: "avatarRenderStarted", renderId: "render-1" });
    const ready = avatarReducer(rendering, {
      type: "avatarRenderReady",
      renderId: "render-1",
      imageUrl: "data:image/svg+xml,ready",
      imageAssetId: "asset-render-1",
      qualityNotes: ["Demo studio render."],
      nowIso: "2026-05-28T10:01:00.000Z",
    });
    const failed = avatarReducer(ready, {
      type: "avatarRenderFailed",
      renderId: "render-1",
      qualityNotes: ["Could not keep head and shoes visible."],
      nowIso: "2026-05-28T10:02:00.000Z",
    });

    expect(rendering.renders[0]?.status).toBe("rendering");
    expect(ready.renders[0]?.imageUrl).toBe("data:image/svg+xml,ready");
    expect(failed.renders[0]).toMatchObject({ status: "failed", qualityNotes: ["Could not keep head and shoes visible."] });
  });

  it("finds cached ready renders by cache key and deletes only renders", () => {
    const queued = avatarReducer(initialAvatarState, {
      type: "avatarRenderQueued",
      renderId: "render-1",
      request,
      cacheKey: "avatar:cache-key",
      nowIso: "2026-05-28T10:00:00.000Z",
    });
    const ready = avatarReducer(queued, {
      type: "avatarRenderReady",
      renderId: "render-1",
      imageUrl: "ready-url",
      qualityNotes: [],
      nowIso: "2026-05-28T10:01:00.000Z",
    });
    const deleted = avatarReducer(ready, { type: "avatarRenderDeleted", renderId: "render-1" });

    expect(findReadyAvatarRenderByCacheKey(ready, "avatar:cache-key")?.id).toBe("render-1");
    expect(deleted.renders).toEqual([]);
  });
});
