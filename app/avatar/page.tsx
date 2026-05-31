"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchWithAccountSession } from "@/src/features/account/accountApiClient";
import type { AvatarRenderProviderResult } from "@/src/features/wardrobe/avatar/avatarRenderProvider";
import { createAvatarRenderCacheKey } from "@/src/features/wardrobe/avatar/avatarRenderCacheKey";
import { buildAvatarRenderPrompt } from "@/src/features/wardrobe/avatar/avatarRenderPrompt";
import { createAvatarRenderRequest } from "@/src/features/wardrobe/avatar/avatarRenderRequest";
import { createDemoAvatarRenderProvider } from "@/src/features/wardrobe/avatar/demoAvatarRenderProvider";
import { getRuntimeMode } from "@/src/features/runtime/runtimeMode";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { AvatarRenderPanel } from "@/src/features/wardrobe/components/AvatarRenderPanel";
import { AvatarSetupFlow, type AvatarSetupStep } from "@/src/features/wardrobe/components/AvatarSetupFlow";
import { canRegenerateAvatarRender, findReadyAvatarRenderByCacheKey } from "@/src/features/wardrobe/state/avatarReducer";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";
import type { AvatarProfile, AvatarRender } from "@/src/features/wardrobe/avatar/avatarTypes";

type AvatarRenderResponse = AvatarRenderProviderResult & { render?: AvatarRender };

function AvatarPageContent() {
  const searchParams = useSearchParams();
  const savedOutfitId = searchParams.get("savedOutfitId");
  const {
    state,
    mixerState,
    avatarState,
    saveAvatarInput,
    hydrateAvatarProfile,
    hydrateAvatarRenders,
    completeAvatarProfile,
    queueAvatarRender,
    markAvatarRenderStarted,
    markAvatarRenderReady,
    markAvatarRenderFailed,
    deleteAvatarRender,
  } = useWardrobe();
  const [setupStep, setSetupStep] = useState<AvatarSetupStep>(avatarState.profile ? "review" : "face");
  const [isEditingAvatarProfile, setIsEditingAvatarProfile] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const runtimeMode = useMemo(() => getRuntimeMode(), []);
  const savedOutfit = mixerState.savedOutfits.find((outfit) => outfit.id === savedOutfitId) ?? null;
  const selectedWardrobeItems = useMemo(() => {
    if (!savedOutfit) return [];
    const ids = new Set(savedOutfit.selections.map((selection) => selection.wardrobeItemId).filter(Boolean));
    return state.closetItems.filter((item) => ids.has(item.id));
  }, [savedOutfit, state.closetItems]);
  const renderRequest = useMemo(() => {
    if (!savedOutfit || !avatarState.profile) return null;

    try {
      return createAvatarRenderRequest({ avatarProfile: avatarState.profile, savedOutfit });
    } catch {
      return null;
    }
  }, [avatarState.profile, savedOutfit]);
  const cacheKey = renderRequest ? createAvatarRenderCacheKey(renderRequest) : null;
  const cachedRender = cacheKey ? findReadyAvatarRenderByCacheKey(avatarState, cacheKey) : null;
  const activeRender =
    cachedRender ??
    (cacheKey ? [...avatarState.renders].reverse().find((render) => render.cacheKey === cacheKey && render.status !== "deleted") ?? null : null);
  const prompt =
    savedOutfit && renderRequest
      ? buildAvatarRenderPrompt({
          savedOutfitName: savedOutfit.name,
          items: selectedWardrobeItems,
          poseId: renderRequest.poseId,
          quality: renderRequest.quality,
        })
      : "";

  useEffect(() => {
    if (runtimeMode !== "real") return;

    void fetchWithAccountSession("/api/wardrobe/avatar/profile")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Could not load avatar profile."))))
      .then((payload: { profile: AvatarProfile | null }) => {
        if (payload.profile) {
          hydrateAvatarProfile(payload.profile);
          setSetupStep("review");
          setIsEditingAvatarProfile(false);
        }
      })
      .catch(() => undefined);

    void fetchWithAccountSession("/api/wardrobe/avatar/renders")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Could not load avatar renders."))))
      .then((payload: { renders: AvatarRender[] }) => hydrateAvatarRenders(payload.renders))
      .catch(() => undefined);
    // The wardrobe context action functions are recreated with the context value.
    // This effect should run only when the runtime mode is known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimeMode]);

  async function generateAvatarRender(forceRegenerate = false) {
    if (!savedOutfit || !avatarState.profile || !renderRequest || !cacheKey) return;
    const cached = findReadyAvatarRenderByCacheKey(avatarState, cacheKey);
    if (cached && !forceRegenerate) return;

    const renderId = queueAvatarRender(renderRequest, cacheKey);
    markAvatarRenderStarted(renderId);
    setIsRendering(true);

    try {
      let result: AvatarRenderResponse;
      if (runtimeMode === "real") {
        const response = await fetchWithAccountSession("/api/wardrobe/avatar/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request: renderRequest,
            avatarProfile: avatarState.profile,
            savedOutfit,
            wardrobeItems: selectedWardrobeItems,
            prompt,
            cacheKey,
            forceRegenerate,
          }),
        });
        result = (await response.json()) as AvatarRenderResponse;
      } else {
        result = await createDemoAvatarRenderProvider().renderAvatar({
          request: renderRequest,
          avatarProfile: avatarState.profile,
          savedOutfit,
          wardrobeItems: selectedWardrobeItems,
          prompt,
          cacheKey,
          faceImageUrl: avatarState.pendingFacePreviewUrl ?? undefined,
          bodyImageUrl: avatarState.pendingBodyPreviewUrl ?? undefined,
        });
      }

      if (result.status === "ready" && result.imageUrl) {
        if ("render" in result && result.render) {
          hydrateAvatarRenders([result.render, ...avatarState.renders.filter((render) => render.id !== result.render?.id)]);
          deleteAvatarRender(renderId);
        } else {
          markAvatarRenderReady(renderId, result.imageUrl, result.qualityNotes, result.imageAssetId);
        }
      } else {
        markAvatarRenderFailed(renderId, result.qualityNotes.length ? result.qualityNotes : ["Avatar render failed."]);
      }
    } catch (error) {
      markAvatarRenderFailed(renderId, [error instanceof Error ? error.message : "Avatar render failed."]);
    } finally {
      setIsRendering(false);
    }
  }

  async function finishAvatarProfile() {
    if (!savedOutfit) return;

    if (runtimeMode !== "real") {
      completeAvatarProfile(savedOutfit.profileId);
      setIsEditingAvatarProfile(false);
      return;
    }

    if (
      !avatarState.pendingFaceAssetId ||
      !avatarState.pendingFaceStoragePath ||
      !avatarState.pendingFaceContentType ||
      !avatarState.pendingBodyAssetId ||
      !avatarState.pendingBodyStoragePath ||
      !avatarState.pendingBodyContentType ||
      !avatarState.pendingFaceQuality ||
      !avatarState.pendingBodyQuality
    ) {
      return;
    }

    const response = await fetchWithAccountSession("/api/wardrobe/avatar/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
        faceQuality: avatarState.pendingFaceQuality,
        bodyQuality: avatarState.pendingBodyQuality,
      }),
    });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { profile: AvatarProfile };
    hydrateAvatarProfile(payload.profile);
    setIsEditingAvatarProfile(false);
  }

  async function deleteRender(renderId: string) {
    if (runtimeMode !== "real") {
      deleteAvatarRender(renderId);
      return;
    }

    const response = await fetchWithAccountSession(`/api/wardrobe/avatar/renders/${encodeURIComponent(renderId)}`, { method: "DELETE" });
    if (!response.ok) {
      deleteAvatarRender(renderId);
      return;
    }

    const payload = (await response.json()) as { deletedRenderId: string };
    deleteAvatarRender(payload.deletedRenderId);
  }

  if (!savedOutfit) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Avatar Studio</h1>
            <p className="subtle">Launch from a saved look</p>
          </div>
          <Link className="button secondary" href="/closet">
            <ArrowLeft size={16} aria-hidden="true" />
            Go to wardrobe
          </Link>
        </div>
        <section className="card" style={{ display: "grid", gap: 10 }}>
          <strong>Choose a saved look first</strong>
          <p className="subtle" style={{ margin: 0 }}>
            Avatar Studio only renders outfits you have already saved. Mixer and Stylist browsing stay fast and avatar-free.
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <h1 className="app-title" style={{ margin: 0 }}>
            Avatar Studio
          </h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: "0 0 auto" }}>
            <span
              aria-label={`${runtimeMode} mode`}
              title={`${runtimeMode} mode`}
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: runtimeMode === "real" ? "#242622" : "#8b9387",
                boxShadow: "0 0 0 4px rgba(36,38,34,.06)",
                flex: "0 0 auto",
              }}
            />
            <Link className="button secondary" href="/closet" style={{ width: "auto", minHeight: 34, padding: "7px 12px" }}>
              Go to wardrobe
            </Link>
          </div>
        </div>
        <p className="subtle" style={{ margin: 0 }}>
          {savedOutfit.name}
        </p>
      </div>

      <div className="stack">
        {!avatarState.profile || isEditingAvatarProfile ? (
          <AvatarSetupFlow
            step={setupStep}
            facePreviewUrl={avatarState.pendingFacePreviewUrl}
            bodyPreviewUrl={avatarState.pendingBodyPreviewUrl}
            faceQuality={avatarState.pendingFaceQuality}
            bodyQuality={avatarState.pendingBodyQuality}
            uploadMode={runtimeMode === "real" ? "direct" : "local"}
            onSaveInput={saveAvatarInput}
            onStepChange={setSetupStep}
            onComplete={() => void finishAvatarProfile()}
          />
        ) : (
          <AvatarRenderPanel
            savedOutfit={savedOutfit}
            closetItems={state.closetItems}
            avatarProfile={avatarState.profile}
            render={activeRender}
            canRegenerate={cacheKey ? canRegenerateAvatarRender(avatarState, cacheKey) : false}
            isBusy={isRendering}
            onUpdateAvatar={() => {
              setSetupStep("review");
              setIsEditingAvatarProfile(true);
            }}
            onGenerate={() => void generateAvatarRender(false)}
            onRegenerate={() => void generateAvatarRender(true)}
            onDelete={(renderId) => void deleteRender(renderId)}
          />
        )}
      </div>
    </AppShell>
  );
}

export default function AvatarPage() {
  return (
    <Suspense fallback={null}>
      <AvatarPageContent />
    </Suspense>
  );
}
