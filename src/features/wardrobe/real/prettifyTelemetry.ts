type ImageQuality = "low" | "medium" | "high";
type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";

interface CostInput {
  model: string;
  quality: ImageQuality;
  size: ImageSize;
}

interface TelemetryCostEvent {
  imageOutputCostUsd: number | null;
}

interface TelemetryPayload {
  [key: string]: unknown;
}

const imageOutputCostUsd: Record<string, Record<ImageQuality, Record<ImageSize, number>>> = {
  "gpt-image-2": {
    low: { "1024x1024": 0.006, "1024x1536": 0.005, "1536x1024": 0.005 },
    medium: { "1024x1024": 0.053, "1024x1536": 0.041, "1536x1024": 0.041 },
    high: { "1024x1024": 0.211, "1024x1536": 0.165, "1536x1024": 0.165 },
  },
  "gpt-image-1.5": {
    low: { "1024x1024": 0.009, "1024x1536": 0.013, "1536x1024": 0.013 },
    medium: { "1024x1024": 0.034, "1024x1536": 0.05, "1536x1024": 0.05 },
    high: { "1024x1024": 0.133, "1024x1536": 0.2, "1536x1024": 0.2 },
  },
  "gpt-image-1": {
    low: { "1024x1024": 0.011, "1024x1536": 0.016, "1536x1024": 0.016 },
    medium: { "1024x1024": 0.042, "1024x1536": 0.063, "1536x1024": 0.063 },
    high: { "1024x1024": 0.167, "1024x1536": 0.25, "1536x1024": 0.25 },
  },
  "gpt-image-1-mini": {
    low: { "1024x1024": 0.005, "1024x1536": 0.006, "1536x1024": 0.006 },
    medium: { "1024x1024": 0.011, "1024x1536": 0.015, "1536x1024": 0.015 },
    high: { "1024x1024": 0.036, "1024x1536": 0.052, "1536x1024": 0.052 },
  },
};

export function estimateImageOutputCostUsd(input: CostInput): number | null {
  return imageOutputCostUsd[input.model]?.[input.quality]?.[input.size] ?? null;
}

export function summarizeTelemetryCost(events: TelemetryCostEvent[]) {
  const knownImageOutputCostUsd = events.reduce(
    (total, event) => total + (event.imageOutputCostUsd ?? 0),
    0,
  );
  return {
    knownImageOutputCostUsd: Number(knownImageOutputCostUsd.toFixed(3)),
    unknownCostEvents: events.filter((event) => event.imageOutputCostUsd === null).length,
  };
}

export function logWearaboutsTelemetry(event: string, payload: TelemetryPayload = {}) {
  console.info(
    JSON.stringify({
      event: `wearabouts.telemetry.${event}`,
      at: new Date().toISOString(),
      ...payload,
    }),
  );
}

export function createTimer() {
  const startedAt = Date.now();
  return {
    elapsedMs: () => Date.now() - startedAt,
  };
}
