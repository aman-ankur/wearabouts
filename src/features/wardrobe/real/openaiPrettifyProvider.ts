import OpenAI, { toFile } from "openai";
import type { ConfidenceLevel, GarmentCategory } from "@/src/domain/wardrobe";
import type {
  GarmentAnalysisResult,
  GeneratedImageResult,
  OutfitDetectionResult,
  PrettifyAIProvider,
  RealSourceImageRecord,
  ValidationResult,
} from "./realWardrobePipeline";
import { normalizeImageForOpenAI, type OpenAIImageNormalizationOptions } from "./openaiImageNormalizer";
import type { GarmentVisibilityState } from "@/src/domain/wardrobe";
import {
  createTimer,
  estimateImageOutputCostUsd,
  logWearaboutsTelemetry,
} from "./prettifyTelemetry";

const garmentCategories: GarmentCategory[] = ["tops", "bottoms", "outerwear", "footwear", "accessories", "combo"];
const confidenceLevels: ConfidenceLevel[] = ["high", "medium", "low"];
const visibilityStates: GarmentVisibilityState[] = ["visible", "occluded", "needs_review"];

interface OpenAIResponseWithText {
  output_text?: string;
  usage?: unknown;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

interface OpenAIImageResponse {
  data?: Array<{ b64_json?: string }>;
  usage?: unknown;
}

export class OpenAIPrettifyProvider implements PrettifyAIProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly metadataModel: string,
    private readonly imageModel: string,
    private readonly detectionImageOptions: OpenAIImageNormalizationOptions = {
      maxDimension: 1024,
      format: "jpeg",
      quality: 82,
      filenamePrefix: "wearabouts-openai-detection",
    },
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async detectOutfitGarments(input: {
    sourceImage: RealSourceImageRecord;
    bytes: Uint8Array;
  }): Promise<OutfitDetectionResult> {
    const timer = createTimer();
    const normalizeTimer = createTimer();
    const normalized = await normalizeImageForOpenAI(input.bytes, this.detectionImageOptions);
    const normalizeDurationMs = normalizeTimer.elapsedMs();
    const apiTimer = createTimer();
    const response = (await this.client.responses.create({
      model: this.metadataModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this clothing photo for Wearabouts. It may show one standalone garment or a person wearing multiple garments. Detect each visible wardrobe garment separately and return only JSON with candidates. Bounding boxes must be normalized decimals from 0 to 1 relative to the full image. For a standalone item, return exactly one candidate when it is a clear clothing or footwear item. For an outfit/person photo, include outer layers, inner tops, bottoms, shoes, and visible accessories only when enough of the item is visible to create a wardrobe item. Set shouldPrettify=true for visible high-confidence or medium-confidence clothing, footwear, or accessory candidates. Do not invent hidden garments.",
            },
            {
              type: "input_image",
              image_url: this.toDataUrl(normalized.bytes, normalized.contentType),
              detail: "auto",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "wearabouts_outfit_decomposition",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              candidates: {
                type: "array",
                maxItems: 8,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    proposedName: { type: "string" },
                    category: { type: "string", enum: garmentCategories },
                    confidence: { type: "string", enum: confidenceLevels },
                    visibilityState: { type: "string", enum: visibilityStates },
                    boundingBox: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        x: { type: "number" },
                        y: { type: "number" },
                        width: { type: "number" },
                        height: { type: "number" },
                      },
                      required: ["x", "y", "width", "height"],
                    },
                    cropPrompt: { type: "string" },
                    shouldPrettify: { type: "boolean" },
                    reason: { type: "string" },
                  },
                  required: [
                    "proposedName",
                    "category",
                    "confidence",
                    "visibilityState",
                    "boundingBox",
                    "cropPrompt",
                    "shouldPrettify",
                    "reason",
                  ],
                },
              },
            },
            required: ["candidates"],
          },
        },
      },
    })) as OpenAIResponseWithText;
    const apiDurationMs = apiTimer.elapsedMs();

    const detection = this.parseOutfitDetection(this.extractText(response));
    logWearaboutsTelemetry("openai.detect_outfit.completed", {
      sourceImageId: input.sourceImage.id,
      model: this.metadataModel,
      apiDurationMs,
      detectionImage: {
        durationMs: normalizeDurationMs,
        contentType: normalized.contentType,
        sizeBytes: normalized.bytes.byteLength,
        width: normalized.width,
        height: normalized.height,
      },
      durationMs: timer.elapsedMs(),
      candidateCount: detection.candidates.length,
      usage: response.usage ?? null,
    });
    return detection;
  }

  async analyzeGarment(input: { sourceImage: RealSourceImageRecord; bytes: Uint8Array }): Promise<GarmentAnalysisResult> {
    const timer = createTimer();
    const normalized = await normalizeImageForOpenAI(input.bytes);
    const response = (await this.client.responses.create({
      model: this.metadataModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this standalone clothing photo for Wearabouts. Return only JSON with accepted, proposedName, category, confidence, and readyForMixer. Reject if this is not a clear standalone clothing or footwear item.",
            },
            {
              type: "input_image",
              image_url: this.toDataUrl(normalized.bytes, normalized.contentType),
              detail: "auto",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "wearabouts_garment_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              accepted: { type: "boolean" },
              proposedName: { type: "string" },
              category: { type: "string", enum: garmentCategories },
              confidence: { type: "string", enum: confidenceLevels },
              readyForMixer: { type: "boolean" },
            },
            required: ["accepted", "proposedName", "category", "confidence", "readyForMixer"],
          },
        },
      },
    })) as OpenAIResponseWithText;

    const analysis = this.parseAnalysis(this.extractText(response));
    logWearaboutsTelemetry("openai.analyze_garment.completed", {
      sourceImageId: input.sourceImage.id,
      model: this.metadataModel,
      durationMs: timer.elapsedMs(),
      category: analysis.category,
      confidence: analysis.confidence,
      usage: response.usage ?? null,
    });
    return analysis;
  }

  async prettifyGarment(input: {
    sourceImage: RealSourceImageRecord;
    bytes: Uint8Array;
    analysis: GarmentAnalysisResult;
  }): Promise<GeneratedImageResult> {
    const timer = createTimer();
    const normalized = await normalizeImageForOpenAI(input.bytes);
    const image = await toFile(Buffer.from(normalized.bytes), normalized.filename, {
      type: normalized.contentType,
    });
    const response = (await this.client.images.edit({
      model: this.imageModel,
      image,
      size: "1024x1024",
      quality: "high",
      prompt: `Create a clean neutral studio catalog image of this exact real garment: ${input.analysis.proposedName}. ${input.analysis.cropPrompt ? `Target garment guidance: ${input.analysis.cropPrompt}. ` : ""}Preserve color, pattern, silhouette, logos, hems, sleeves, and distinctive details. Center it on a light neutral background with even lighting. Do not invent a different garment.`,
    })) as OpenAIImageResponse;
    const base64 = response.data?.[0]?.b64_json;
    if (!base64) {
      throw new Error("OpenAI image edit did not return an image.");
    }

    logWearaboutsTelemetry("openai.image_edit.completed", {
      sourceImageId: input.sourceImage.id,
      model: this.imageModel,
      durationMs: timer.elapsedMs(),
      proposedName: input.analysis.proposedName,
      category: input.analysis.category,
      quality: "high",
      size: "1024x1024",
      estimatedOutputCostUsd: estimateImageOutputCostUsd({
        model: this.imageModel,
        quality: "high",
        size: "1024x1024",
      }),
      usage: response.usage ?? null,
    });
    return { bytes: new Uint8Array(Buffer.from(base64, "base64")), contentType: "image/png" };
  }

  async validatePrettifiedAsset(input: {
    sourceImage: RealSourceImageRecord;
    sourceBytes: Uint8Array;
    assetBytes: Uint8Array;
    analysis: GarmentAnalysisResult;
  }): Promise<ValidationResult> {
    const timer = createTimer();
    const normalizedSource = await normalizeImageForOpenAI(input.sourceBytes);
    const response = (await this.client.responses.create({
      model: this.metadataModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Compare the original clothing photo and generated wardrobe item. Return JSON with accepted=true only if the generated asset preserves the same color family, pattern, silhouette, and key garment details.",
            },
            {
              type: "input_image",
              image_url: this.toDataUrl(normalizedSource.bytes, normalizedSource.contentType),
              detail: "auto",
            },
            { type: "input_image", image_url: this.toDataUrl(input.assetBytes, "image/png"), detail: "auto" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "wearabouts_asset_validation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: { accepted: { type: "boolean" } },
            required: ["accepted"],
          },
        },
      },
    })) as OpenAIResponseWithText;

    const parsed = JSON.parse(this.extractText(response)) as ValidationResult;
    logWearaboutsTelemetry("openai.validate_asset.completed", {
      sourceImageId: input.sourceImage.id,
      model: this.metadataModel,
      durationMs: timer.elapsedMs(),
      proposedName: input.analysis.proposedName,
      accepted: Boolean(parsed.accepted),
      usage: response.usage ?? null,
    });
    return { accepted: Boolean(parsed.accepted) };
  }

  private toDataUrl(bytes: Uint8Array, contentType: string): string {
    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  }

  private extractText(response: OpenAIResponseWithText): string {
    if (response.output_text) {
      return response.output_text;
    }

    const text = response.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text")?.text;
    if (!text) {
      throw new Error("OpenAI response did not include text output.");
    }

    return text;
  }

  private parseAnalysis(text: string): GarmentAnalysisResult {
    const parsed = JSON.parse(text) as GarmentAnalysisResult;
    if (!garmentCategories.includes(parsed.category) || !confidenceLevels.includes(parsed.confidence)) {
      throw new Error("OpenAI returned unsupported garment metadata.");
    }

    return {
      accepted: Boolean(parsed.accepted),
      proposedName: parsed.proposedName,
      category: parsed.category,
      confidence: parsed.confidence,
      readyForMixer: Boolean(parsed.readyForMixer),
    };
  }

  private parseOutfitDetection(text: string): OutfitDetectionResult {
    const parsed = JSON.parse(text) as OutfitDetectionResult;
    const candidates = Array.isArray(parsed.candidates) ? parsed.candidates : [];

    for (const candidate of candidates) {
      if (
        !garmentCategories.includes(candidate.category) ||
        !confidenceLevels.includes(candidate.confidence) ||
        !visibilityStates.includes(candidate.visibilityState)
      ) {
        throw new Error("OpenAI returned unsupported outfit garment metadata.");
      }
    }

    return { candidates };
  }
}
