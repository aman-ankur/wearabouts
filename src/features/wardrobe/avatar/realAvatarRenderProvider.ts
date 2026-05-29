import OpenAI, { toFile } from "openai";
import {
  createTimer,
  estimateImageOutputCostUsd,
  logWearaboutsTelemetry,
} from "@/src/features/wardrobe/real/prettifyTelemetry";
import { normalizeImageForOpenAI } from "@/src/features/wardrobe/real/openaiImageNormalizer";
import type { AvatarRenderProvider, AvatarRenderProviderRequest, AvatarRenderProviderResult } from "./avatarRenderProvider";

export interface RealAvatarRenderConfig {
  avatarRealRenderEnabled: boolean;
  model: string;
  size: string;
  quality: string;
}

interface OpenAIImagesClient {
  images: {
    edit: (input: Record<string, unknown>) => Promise<{ data?: Array<{ b64_json?: string }>; usage?: unknown }>;
  };
}

interface CreateRealAvatarRenderProviderInput {
  client?: OpenAIImagesClient;
  apiKey?: string;
  config: RealAvatarRenderConfig;
}

interface AvatarReferenceImage {
  role: "face" | "body" | "wardrobe";
  label: string;
  imageUrl: string;
}

interface PreparedAvatarReferenceImage {
  file: Awaited<ReturnType<typeof toFile>>;
  diagnostic: {
    index: number;
    role: AvatarReferenceImage["role"];
    label: string;
    sourceContentType: string;
    sourceBytes: number;
    normalizedContentType: string;
    normalizedBytes: number;
    width: number;
    height: number;
  };
}

export function isAvatarRealRenderEnabled(config: Pick<RealAvatarRenderConfig, "avatarRealRenderEnabled">): boolean {
  return config.avatarRealRenderEnabled;
}

function costQuality(value: string): Parameters<typeof estimateImageOutputCostUsd>[0]["quality"] | null {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}

function costSize(value: string): Parameters<typeof estimateImageOutputCostUsd>[0]["size"] | null {
  return value === "1024x1024" || value === "1024x1536" || value === "1536x1024" ? value : null;
}

function estimatedCostUsd(config: RealAvatarRenderConfig): number | null {
  const quality = costQuality(config.quality);
  const size = costSize(config.size);
  if (!quality || !size) {
    return null;
  }

  return estimateImageOutputCostUsd({ model: config.model, quality, size });
}

async function readImageUrl(imageUrl: string): Promise<{ bytes: Buffer; contentType: string }> {
  if (imageUrl.startsWith("data:")) {
    const [header, base64 = ""] = imageUrl.split(",", 2);
    const contentType = header.match(/^data:(.*?);base64$/)?.[1] ?? "image/png";
    return { bytes: Buffer.from(base64, "base64"), contentType };
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch avatar reference image: ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return { bytes, contentType: response.headers.get("content-type") ?? "application/octet-stream" };
}

async function prepareReferenceImage(reference: AvatarReferenceImage, index: number): Promise<PreparedAvatarReferenceImage> {
  const source = await readImageUrl(reference.imageUrl);
  const normalized = await normalizeImageForOpenAI(source.bytes, {
    maxDimension: 1536,
    format: "jpeg",
    quality: 92,
    filenamePrefix: `wearabouts-avatar-ref-${index}-${reference.role}`,
  });

  return {
    file: await toFile(Buffer.from(normalized.bytes), normalized.filename, { type: normalized.contentType }),
    diagnostic: {
      index,
      role: reference.role,
      label: reference.label,
      sourceContentType: source.contentType,
      sourceBytes: source.bytes.byteLength,
      normalizedContentType: normalized.contentType,
      normalizedBytes: normalized.bytes.byteLength,
      width: normalized.width,
      height: normalized.height,
    },
  };
}

export function createRealAvatarRenderProvider(input: CreateRealAvatarRenderProviderInput): AvatarRenderProvider {
  const client = input.client ?? (new OpenAI({ apiKey: input.apiKey }) as unknown as OpenAIImagesClient);

  return {
    async renderAvatar(request: AvatarRenderProviderRequest): Promise<AvatarRenderProviderResult> {
      const timer = createTimer();
      if (!isAvatarRealRenderEnabled(input.config)) {
        logWearaboutsTelemetry("avatar.real_render.blocked", {
          savedOutfitId: request.request.savedOutfitId,
          reason: "avatar_real_render_disabled",
        });
        return {
          status: "failed",
          qualityNotes: ["Real avatar rendering is disabled. Set WEARABOUTS_AVATAR_REAL_RENDER_ENABLED=true to enable it."],
        };
      }

      try {
        const references: AvatarReferenceImage[] = [
          request.bodyImageUrl ? { role: "body", label: "Avatar body reference", imageUrl: request.bodyImageUrl } : null,
          request.faceImageUrl ? { role: "face", label: "Avatar face reference", imageUrl: request.faceImageUrl } : null,
          ...request.wardrobeItems.map((item) =>
            "imageUrl" in item.asset
              ? { role: "wardrobe" as const, label: item.name, imageUrl: item.asset.imageUrl }
              : null,
          ),
        ].filter((reference): reference is AvatarReferenceImage => Boolean(reference));

        if (references.length < 3) {
          logWearaboutsTelemetry("avatar.real_render.blocked", {
            savedOutfitId: request.request.savedOutfitId,
            reason: "missing_reference_images",
            referenceImageCount: references.length,
            wardrobeItemCount: request.wardrobeItems.length,
          });
          return {
            status: "failed",
            qualityNotes: ["Real avatar rendering needs face, body, and at least one real wardrobe item image."],
          };
        }

        logWearaboutsTelemetry("avatar.real_render.started", {
          savedOutfitId: request.request.savedOutfitId,
          avatarProfileId: request.request.avatarProfileId,
          model: input.config.model,
          size: input.config.size,
          quality: input.config.quality,
          poseId: request.request.poseId,
          referenceImageCount: references.length,
          wardrobeItemCount: request.wardrobeItems.length,
          promptVersion: request.request.promptVersion,
          estimatedOutputCostUsd: estimatedCostUsd(input.config),
        });

        const preparedReferences = await Promise.all(references.map((reference, index) => prepareReferenceImage(reference, index)));
        logWearaboutsTelemetry("avatar.real_render.references_prepared", {
          savedOutfitId: request.request.savedOutfitId,
          referenceImageCount: preparedReferences.length,
          references: preparedReferences.map((reference) => reference.diagnostic),
        });

        const response = await client.images.edit({
          model: input.config.model,
          image: preparedReferences.map((reference) => reference.file),
          size: input.config.size,
          quality: input.config.quality,
          prompt: request.prompt,
        });
        const base64 = response.data?.[0]?.b64_json;
        if (!base64) {
          throw new Error("OpenAI image edit did not return an image.");
        }

        const outputBytes = Buffer.from(base64, "base64").byteLength;
        logWearaboutsTelemetry("avatar.real_render.completed", {
          savedOutfitId: request.request.savedOutfitId,
          avatarProfileId: request.request.avatarProfileId,
          model: input.config.model,
          size: input.config.size,
          quality: input.config.quality,
          poseId: request.request.poseId,
          referenceImageCount: references.length,
          wardrobeItemCount: request.wardrobeItems.length,
          promptVersion: request.request.promptVersion,
          durationMs: timer.elapsedMs(),
          outputBytes,
          estimatedOutputCostUsd: estimatedCostUsd(input.config),
          usage: response.usage ?? null,
        });

        return {
          status: "ready",
          imageUrl: `data:image/png;base64,${base64}`,
          imageAssetId: `real-avatar-${request.request.savedOutfitId}-${Date.now()}`,
          qualityNotes: ["Real OpenAI avatar render completed."],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown provider error";
        logWearaboutsTelemetry("avatar.real_render.failed", {
          savedOutfitId: request.request.savedOutfitId,
          avatarProfileId: request.request.avatarProfileId,
          model: input.config.model,
          size: input.config.size,
          quality: input.config.quality,
          poseId: request.request.poseId,
          durationMs: timer.elapsedMs(),
          estimatedOutputCostUsd: estimatedCostUsd(input.config),
          error: message,
        });
        return { status: "failed", qualityNotes: [`Real avatar render failed: ${message}`] };
      }
    },
  };
}
