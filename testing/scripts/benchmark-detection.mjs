#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import OpenAI from "openai";
import sharp from "sharp";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const garmentCategories = ["tops", "bottoms", "outerwear", "footwear", "accessories", "combo"];
const confidenceLevels = ["high", "medium", "low"];
const visibilityStates = ["visible", "occluded", "needs_review"];

const variants = {
  current: {
    label: "current-1600-png",
    maxDimension: 1600,
    format: "png",
    quality: 82,
  },
  fast: {
    label: "fast-1024-jpeg",
    maxDimension: 1024,
    format: "jpeg",
    quality: 82,
  },
};

async function main() {
  await loadDotEnvLocal();
  const options = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required. Add it to .env.local or export it before running the benchmark.");
  }

  const imagePaths = await resolveImagePaths(options.paths, options.limit);
  if (imagePaths.length === 0) {
    throw new Error("Pass at least one image file or directory containing .jpg, .jpeg, .png, or .webp files.");
  }

  const selectedVariants = options.variant === "both" ? [variants.current, variants.fast] : [variants[options.variant]];
  const client = new OpenAI({ apiKey });
  const model = options.model ?? process.env.OPENAI_METADATA_MODEL ?? "gpt-5.4";
  const rows = [];

  console.log(
    JSON.stringify(
      {
        event: "wearabouts.benchmark.detection.started",
        model,
        imageCount: imagePaths.length,
        variants: selectedVariants.map((variant) => variant.label),
      },
      null,
      2,
    ),
  );

  for (const imagePath of imagePaths) {
    const bytes = await fs.readFile(imagePath);
    for (const variant of selectedVariants) {
      const row = await runDetectionBenchmark({ client, model, imagePath, bytes, variant });
      rows.push(row);
      console.log(JSON.stringify(row, null, 2));
    }
  }

  console.log(
    JSON.stringify(
      {
        event: "wearabouts.benchmark.detection.summary",
        averages: summarizeRows(rows),
        rows,
      },
      null,
      2,
    ),
  );
}

function parseArgs(args) {
  const options = {
    paths: [],
    limit: 3,
    variant: "both",
    model: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--limit") {
      options.limit = Number.parseInt(args[index + 1] ?? "", 10);
      index += 1;
      continue;
    }

    if (arg === "--variant") {
      const value = args[index + 1];
      if (value !== "current" && value !== "fast" && value !== "both") {
        throw new Error("--variant must be current, fast, or both.");
      }
      options.variant = value;
      index += 1;
      continue;
    }

    if (arg === "--model") {
      options.model = args[index + 1] ?? null;
      index += 1;
      continue;
    }

    options.paths.push(arg);
  }

  return options;
}

async function resolveImagePaths(inputs, limit) {
  const resolved = [];
  for (const input of inputs) {
    const absolutePath = path.resolve(input);
    const stat = await fs.stat(absolutePath);
    if (stat.isDirectory()) {
      const children = await fs.readdir(absolutePath);
      for (const child of children.sort()) {
        const childPath = path.join(absolutePath, child);
        const childStat = await fs.stat(childPath);
        if (childStat.isFile() && imageExtensions.has(path.extname(child).toLowerCase())) {
          resolved.push(childPath);
        }
      }
      continue;
    }

    if (stat.isFile() && imageExtensions.has(path.extname(absolutePath).toLowerCase())) {
      resolved.push(absolutePath);
    }
  }

  return resolved.slice(0, Number.isFinite(limit) && limit > 0 ? limit : 3);
}

async function runDetectionBenchmark({ client, model, imagePath, bytes, variant }) {
  const normalizeStartedAt = performance.now();
  const normalized = await normalizeForDetection(bytes, variant);
  const normalizeDurationMs = Math.round(performance.now() - normalizeStartedAt);
  const apiStartedAt = performance.now();
  const response = await client.responses.create({
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Analyze this clothing photo for Wearabouts. It may show one standalone garment or a person wearing multiple garments. Detect each visible wardrobe garment separately and return only JSON with candidates. Bounding boxes must be normalized decimals from 0 to 1 relative to the full image. For a standalone item, return exactly one candidate when it is a clear clothing or footwear item. For an outfit/person photo, include outer layers, inner tops, bottoms, shoes, and visible accessories only when enough of the item is visible to create a closet asset. Set shouldPrettify=true for visible high-confidence or medium-confidence clothing, footwear, or accessory candidates. Do not invent hidden garments.",
          },
          {
            type: "input_image",
            image_url: toDataUrl(normalized.bytes, normalized.contentType),
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
  });
  const apiDurationMs = Math.round(performance.now() - apiStartedAt);
  const parsed = JSON.parse(extractText(response));

  return {
    event: "wearabouts.benchmark.detection.result",
    image: path.basename(imagePath),
    variant: variant.label,
    model,
    normalizeDurationMs,
    apiDurationMs,
    totalDurationMs: normalizeDurationMs + apiDurationMs,
    normalizedImage: {
      contentType: normalized.contentType,
      sizeBytes: normalized.bytes.byteLength,
      width: normalized.width,
      height: normalized.height,
    },
    candidateCount: parsed.candidates.length,
    candidates: parsed.candidates.map((candidate) => ({
      proposedName: candidate.proposedName,
      category: candidate.category,
      confidence: candidate.confidence,
      visibilityState: candidate.visibilityState,
      shouldPrettify: candidate.shouldPrettify,
    })),
    usage: response.usage ?? null,
  };
}

async function normalizeForDetection(bytes, variant) {
  const pipeline = sharp(Buffer.from(bytes), { failOn: "none" })
    .rotate()
    .toColorspace("srgb")
    .resize({
      width: variant.maxDimension,
      height: variant.maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    });
  const output =
    variant.format === "png"
      ? await pipeline.png().toBuffer({ resolveWithObject: true })
      : await pipeline.jpeg({ quality: variant.quality }).toBuffer({ resolveWithObject: true });

  return {
    bytes: output.data,
    contentType: variant.format === "png" ? "image/png" : "image/jpeg",
    width: output.info.width,
    height: output.info.height,
  };
}

function extractText(response) {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  const contentText = response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text" || content.type === "text")?.text;

  if (!contentText) {
    throw new Error("OpenAI response did not include output text.");
  }

  return contentText;
}

function toDataUrl(bytes, contentType) {
  return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
}

function summarizeRows(rows) {
  const byVariant = new Map();
  for (const row of rows) {
    const summary = byVariant.get(row.variant) ?? {
      sampleCount: 0,
      totalDurationMs: 0,
      apiDurationMs: 0,
      totalTokens: 0,
      imageSizeBytes: 0,
      candidateCount: 0,
    };
    summary.sampleCount += 1;
    summary.totalDurationMs += row.totalDurationMs;
    summary.apiDurationMs += row.apiDurationMs;
    summary.totalTokens += row.usage?.total_tokens ?? 0;
    summary.imageSizeBytes += row.normalizedImage.sizeBytes;
    summary.candidateCount += row.candidateCount;
    byVariant.set(row.variant, summary);
  }

  return Object.fromEntries(
    Array.from(byVariant.entries()).map(([variant, summary]) => [
      variant,
      {
        sampleCount: summary.sampleCount,
        avgTotalDurationMs: Math.round(summary.totalDurationMs / summary.sampleCount),
        avgApiDurationMs: Math.round(summary.apiDurationMs / summary.sampleCount),
        avgTotalTokens: Math.round(summary.totalTokens / summary.sampleCount),
        avgImageSizeBytes: Math.round(summary.imageSizeBytes / summary.sampleCount),
        avgCandidateCount: Number((summary.candidateCount / summary.sampleCount).toFixed(2)),
      },
    ]),
  );
}

async function loadDotEnvLocal() {
  const envPath = path.resolve(".env.local");
  try {
    const contents = await fs.readFile(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) {
        continue;
      }
      const key = trimmed.slice(0, equalsIndex);
      const value = trimmed.slice(equalsIndex + 1);
      process.env[key] ??= value;
    }
  } catch {
    // A checked-in .env is not required; exported environment variables work too.
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
