import type { OpenAIImageNormalizationOptions } from "./openaiImageNormalizer";
import type { ImageQuality } from "./prettifyTelemetry";

export const REAL_HOUSEHOLD_ID = "demo-household";
export const REAL_PROFILE_ID = "profile-aankur";

export interface RealWardrobeConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  openaiApiKey: string;
  openaiMetadataModel: string;
  openaiImageModel: string;
  openaiDetectionImage: Required<OpenAIImageNormalizationOptions>;
  openaiPrettifyImage: Required<OpenAIImageNormalizationOptions>;
  openaiPrettifyImageQuality: ImageQuality;
}

export interface RealAvatarRenderConfig {
  openaiApiKey: string;
  avatarRealRenderEnabled: boolean;
  model: string;
  size: string;
  quality: string;
}

export function getRealWardrobeConfig(): RealWardrobeConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !openaiApiKey) {
    throw new Error("Real mode requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY.");
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    openaiApiKey,
    openaiMetadataModel: process.env.OPENAI_METADATA_MODEL ?? "gpt-5.4",
    openaiImageModel: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5",
    openaiDetectionImage: {
      maxDimension: parsePositiveInteger(process.env.OPENAI_DETECTION_IMAGE_MAX_DIMENSION, 1024),
      format: parseDetectionFormat(process.env.OPENAI_DETECTION_IMAGE_FORMAT),
      quality: parsePositiveInteger(process.env.OPENAI_DETECTION_IMAGE_QUALITY, 82),
      filenamePrefix: "wearabouts-openai-detection",
    },
    openaiPrettifyImage: {
      maxDimension: parsePositiveInteger(process.env.OPENAI_PRETTIFY_IMAGE_MAX_DIMENSION, 1024),
      format: parseImageInputFormat(process.env.OPENAI_PRETTIFY_IMAGE_FORMAT),
      quality: parsePositiveInteger(process.env.OPENAI_PRETTIFY_IMAGE_INPUT_QUALITY, 88),
      filenamePrefix: "wearabouts-openai-prettify",
    },
    openaiPrettifyImageQuality: parseImageQuality(process.env.OPENAI_PRETTIFY_IMAGE_QUALITY),
  };
}

export function getRealAvatarRenderConfig(): RealAvatarRenderConfig {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error("Real avatar rendering requires OPENAI_API_KEY.");
  }

  return {
    openaiApiKey,
    avatarRealRenderEnabled: process.env.WEARABOUTS_AVATAR_REAL_RENDER_ENABLED === "true",
    model: process.env.OPENAI_AVATAR_IMAGE_MODEL ?? "gpt-image-2",
    size: process.env.OPENAI_AVATAR_IMAGE_SIZE ?? "1024x1536",
    quality: process.env.OPENAI_AVATAR_IMAGE_QUALITY ?? "high",
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDetectionFormat(value: string | undefined): Required<OpenAIImageNormalizationOptions>["format"] {
  if (value === "png" || value === "jpeg" || value === "webp") {
    return value;
  }

  return "jpeg";
}

function parseImageInputFormat(value: string | undefined): Required<OpenAIImageNormalizationOptions>["format"] {
  if (value === "png" || value === "jpeg" || value === "webp") {
    return value;
  }

  return "jpeg";
}

function parseImageQuality(value: string | undefined): ImageQuality {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "medium";
}
