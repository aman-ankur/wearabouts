import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAccountSession } from "@/src/features/account/accountSession";
import { withAvatarProfileReferenceImages, type AvatarRenderProviderRequest } from "@/src/features/wardrobe/avatar/avatarRenderProvider";
import { AvatarPersistence } from "@/src/features/wardrobe/avatar/avatarPersistence";
import { createRealAvatarRenderProvider } from "@/src/features/wardrobe/avatar/realAvatarRenderProvider";
import { logWearaboutsTelemetry } from "@/src/features/wardrobe/real/prettifyTelemetry";
import { getRealAvatarRenderConfig } from "@/src/features/wardrobe/real/realWardrobeConfig";
import { createSupabaseServiceClient } from "@/src/features/wardrobe/real/supabaseServerClient";

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_TRAVOGUE_MODE !== "real") {
    return NextResponse.json(
      { status: "failed", qualityNotes: ["Real avatar rendering requires runtime mode real."] },
      { status: 403 },
    );
  }

  const session = await requireAccountSession(request);
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const payload = (await request.json()) as AvatarRenderProviderRequest;
  if (payload.avatarProfile.profileId !== session.profileId) {
    return NextResponse.json({ error: "That wardrobe profile is not available in your Circle." }, { status: 403 });
  }

  let config;
  try {
    config = getRealAvatarRenderConfig();
  } catch (error) {
    return NextResponse.json(
      { status: "failed", qualityNotes: [error instanceof Error ? error.message : "Avatar real-render config is missing."] },
      { status: 503 },
    );
  }

  const persistence = new AvatarPersistence(createSupabaseServiceClient(), { circleId: session.circleId, profileId: session.profileId });
  if (!payload.forceRegenerate) {
    const cached = await persistence.getReadyRender(payload.cacheKey);
    if (cached) {
      logWearaboutsTelemetry("avatar.real_render.cache_hit", {
        cacheKey: payload.cacheKey,
        renderId: cached.id,
        savedOutfitId: payload.request.savedOutfitId,
      });

      return NextResponse.json({
        status: "ready",
        imageUrl: cached.imageUrl,
        imageAssetId: cached.imageAssetId,
        qualityNotes: ["Loaded cached avatar render. No AI was called.", ...cached.qualityNotes],
        render: cached,
      });
    }
  }

  const provider = createRealAvatarRenderProvider({
    client: new OpenAI({ apiKey: config.openaiApiKey }) as unknown as Parameters<typeof createRealAvatarRenderProvider>[0]["client"],
    config,
  });
  const persistedProfile = await persistence.getProfile(payload.avatarProfile.profileId);
  const renderPayload = withAvatarProfileReferenceImages(payload, {
    faceImageUrl: persistedProfile?.faceImageUrl,
    bodyImageUrl: persistedProfile?.bodyImageUrl,
  });
  const result = await provider.renderAvatar(renderPayload);
  if (result.status === "ready" && result.imageUrl) {
    const render = await persistence.saveRender({
      request: renderPayload.request,
      cacheKey: renderPayload.cacheKey,
      imageDataUrl: result.imageUrl,
      qualityNotes: result.qualityNotes,
    });

    return NextResponse.json({
      ...result,
      imageUrl: render.imageUrl,
      imageAssetId: render.imageAssetId,
      render,
      qualityNotes: ["Saved avatar render to your library.", ...result.qualityNotes],
    });
  }

  return NextResponse.json(result, { status: result.status === "ready" ? 200 : 422 });
}
