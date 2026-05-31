import type {
  AvatarInputKind,
  AvatarInputQualityCheck,
  AvatarProfile,
  AvatarRender,
  AvatarRenderRequest,
  AvatarStoredInput,
} from "@/src/features/wardrobe/avatar/avatarTypes";
import type { WardrobeProfileId } from "@/src/domain/wardrobe";

export const MAX_AVATAR_REGENERATIONS_PER_CACHE_KEY = 2;

export interface AvatarState {
  profile: AvatarProfile | null;
  pendingFaceAssetId: string | null;
  pendingBodyAssetId: string | null;
  pendingFaceStoragePath: string | null;
  pendingBodyStoragePath: string | null;
  pendingFaceContentType: AvatarStoredInput["contentType"] | null;
  pendingBodyContentType: AvatarStoredInput["contentType"] | null;
  pendingFacePreviewUrl: string | null;
  pendingBodyPreviewUrl: string | null;
  pendingFaceQuality: AvatarInputQualityCheck | null;
  pendingBodyQuality: AvatarInputQualityCheck | null;
  renders: AvatarRender[];
  renderAttemptsByCacheKey: Record<string, number>;
}

export type AvatarAction =
  | { type: "avatarProfileHydrated"; profile: AvatarProfile | null }
  | { type: "avatarRendersHydrated"; renders: AvatarRender[] }
  | {
      type: "avatarInputSaved";
      kind: AvatarInputKind;
      assetId: string;
      previewUrl: string;
      quality: AvatarInputQualityCheck;
      storedInput?: AvatarStoredInput;
    }
  | {
      type: "avatarProfileCompleted";
      profileId: WardrobeProfileId;
      avatarProfileId: string;
      nowIso: string;
    }
  | {
      type: "avatarRenderQueued";
      renderId: string;
      request: AvatarRenderRequest;
      cacheKey: string;
      nowIso: string;
    }
  | { type: "avatarRenderStarted"; renderId: string }
  | {
      type: "avatarRenderReady";
      renderId: string;
      imageUrl: string;
      imageAssetId?: string;
      qualityNotes: string[];
      nowIso: string;
    }
  | { type: "avatarRenderFailed"; renderId: string; qualityNotes: string[]; nowIso: string }
  | { type: "avatarRenderDeleted"; renderId: string };

export const initialAvatarState: AvatarState = {
  profile: null,
  pendingFaceAssetId: null,
  pendingBodyAssetId: null,
  pendingFaceStoragePath: null,
  pendingBodyStoragePath: null,
  pendingFaceContentType: null,
  pendingBodyContentType: null,
  pendingFacePreviewUrl: null,
  pendingBodyPreviewUrl: null,
  pendingFaceQuality: null,
  pendingBodyQuality: null,
  renders: [],
  renderAttemptsByCacheKey: {},
};

function updateRender(state: AvatarState, renderId: string, update: (render: AvatarRender) => AvatarRender): AvatarState {
  return {
    ...state,
    renders: state.renders.map((render) => (render.id === renderId ? update(render) : render)),
  };
}

export function avatarReducer(state: AvatarState, action: AvatarAction): AvatarState {
  switch (action.type) {
    case "avatarProfileHydrated":
      return {
        ...state,
        profile: action.profile,
        pendingFaceAssetId: action.profile?.faceAssetId ?? state.pendingFaceAssetId,
        pendingBodyAssetId: action.profile?.bodyAssetId ?? state.pendingBodyAssetId,
        pendingFacePreviewUrl: action.profile?.faceImageUrl ?? state.pendingFacePreviewUrl,
        pendingBodyPreviewUrl: action.profile?.bodyImageUrl ?? state.pendingBodyPreviewUrl,
        pendingFaceQuality: action.profile?.faceQuality ?? state.pendingFaceQuality,
        pendingBodyQuality: action.profile?.bodyQuality ?? state.pendingBodyQuality,
      };

    case "avatarRendersHydrated":
      return { ...state, renders: action.renders };

    case "avatarInputSaved":
      if (action.kind === "face") {
        return {
          ...state,
          pendingFaceAssetId: action.assetId,
          pendingFaceStoragePath: action.storedInput?.storagePath ?? null,
          pendingFaceContentType: action.storedInput?.contentType ?? null,
          pendingFacePreviewUrl: action.previewUrl,
          pendingFaceQuality: action.quality,
        };
      }

      return {
        ...state,
        pendingBodyAssetId: action.assetId,
        pendingBodyStoragePath: action.storedInput?.storagePath ?? null,
        pendingBodyContentType: action.storedInput?.contentType ?? null,
        pendingBodyPreviewUrl: action.previewUrl,
        pendingBodyQuality: action.quality,
      };

    case "avatarProfileCompleted":
      if (!state.pendingFaceAssetId || !state.pendingBodyAssetId || !state.pendingFaceQuality || !state.pendingBodyQuality) {
        return state;
      }

      return {
        ...state,
        profile: {
          id: action.avatarProfileId,
          profileId: action.profileId,
          faceAssetId: state.pendingFaceAssetId,
          bodyAssetId: state.pendingBodyAssetId,
          faceQuality: state.pendingFaceQuality,
          bodyQuality: state.pendingBodyQuality,
          createdAtIso: state.profile?.createdAtIso ?? action.nowIso,
          updatedAtIso: action.nowIso,
        },
      };

    case "avatarRenderQueued":
      return {
        ...state,
        renders: [
          ...state.renders,
          {
            id: action.renderId,
            request: action.request,
            cacheKey: action.cacheKey,
            status: "queued",
            qualityNotes: [],
            createdAtIso: action.nowIso,
          },
        ],
        renderAttemptsByCacheKey: {
          ...state.renderAttemptsByCacheKey,
          [action.cacheKey]: (state.renderAttemptsByCacheKey[action.cacheKey] ?? 0) + 1,
        },
      };

    case "avatarRenderStarted":
      return updateRender(state, action.renderId, (render) => ({ ...render, status: "rendering" }));

    case "avatarRenderReady":
      return updateRender(state, action.renderId, (render) => ({
        ...render,
        status: "ready",
        imageUrl: action.imageUrl,
        imageAssetId: action.imageAssetId,
        qualityNotes: action.qualityNotes,
        updatedAtIso: action.nowIso,
      }));

    case "avatarRenderFailed":
      return updateRender(state, action.renderId, (render) => ({
        ...render,
        status: "failed",
        qualityNotes: action.qualityNotes,
        updatedAtIso: action.nowIso,
      }));

    case "avatarRenderDeleted":
      return { ...state, renders: state.renders.filter((render) => render.id !== action.renderId) };
  }
}

export function findReadyAvatarRenderByCacheKey(state: AvatarState, cacheKey: string): AvatarRender | null {
  return [...state.renders].reverse().find((render) => render.cacheKey === cacheKey && render.status === "ready") ?? null;
}

export function canRegenerateAvatarRender(state: AvatarState, cacheKey: string): boolean {
  return (state.renderAttemptsByCacheKey[cacheKey] ?? 0) <= MAX_AVATAR_REGENERATIONS_PER_CACHE_KEY;
}
