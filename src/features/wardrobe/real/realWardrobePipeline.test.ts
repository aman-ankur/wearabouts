import { describe, expect, it } from "vitest";
import sharp from "sharp";
import type {
  GarmentCandidateRecord,
  PrettifyAIProvider,
  PrettifyJobRecord,
  RealAssetStorage,
  RealSourceImageRecord,
  RealUploadFile,
  RealWardrobeRepository,
} from "./realWardrobePipeline";
import { RealWardrobePipeline } from "./realWardrobePipeline";
import type { DetectedGarment, WardrobeItem } from "@/src/domain/wardrobe";

const testPngBytes = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAFElEQVR4nGP8z8Dwn4EIwESJ5jADAKWcAhF4p7iBAAAAAElFTkSuQmCC",
    "base64",
  ),
);

async function createValidPngBytes(): Promise<Uint8Array> {
  const bytes = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 120, g: 130, b: 140 },
    },
  }).png().toBuffer();
  return new Uint8Array(bytes);
}

function createUploadFile(overrides: Partial<RealUploadFile> = {}): RealUploadFile {
  const bytes = testPngBytes;

  return {
    name: "shirt.png",
    type: "image/png",
    size: bytes.byteLength,
    async arrayBuffer() {
      return bytes.buffer;
    },
    ...overrides,
  };
}

function createHarness() {
  const sourceImages = new Map<string, RealSourceImageRecord>();
  const jobs = new Map<string, PrettifyJobRecord>();
  const candidates = new Map<string, GarmentCandidateRecord>();
  const detectedGarments = new Map<string, DetectedGarment>();
  const wardrobeItems: WardrobeItem[] = [];
  let createDetectedGarmentCount = 0;
  let candidateSequence = 0;
  let jobSequence = 0;

  const repository: RealWardrobeRepository = {
    async createUploadBatch(input) {
      return {
        id: input.sourceType === "outfit_photo" ? "batch-outfit-1" : "batch-real-1",
        sourceType: input.sourceType,
        title: input.title,
        createdAtIso: "2026-05-26T10:00:00.000Z",
        detectedGarments: [],
      };
    },
    async createSourceImage(input) {
      const sourceImage: RealSourceImageRecord = {
        id: "source-real-1",
        uploadBatchId: input.uploadBatchId,
        bucket: input.bucket,
        storagePath: input.storagePath,
        signedUrl: input.signedUrl,
        contentType: input.contentType,
        originalFilename: input.originalFilename,
      };
      sourceImages.set(sourceImage.id, sourceImage);
      return sourceImage;
    },
    async createPrettifyJob(input) {
      jobSequence += 1;
      const job: PrettifyJobRecord = {
        id: input.jobKind === "outfit_candidate" ? `job-candidate-${jobSequence}` : input.jobKind === "outfit_parent" ? "job-outfit-1" : "job-real-1",
        uploadBatchId: input.uploadBatchId,
        sourceImageId: input.sourceImageId,
        jobKind: input.jobKind ?? "single_item",
        parentJobId: input.parentJobId ?? null,
        garmentCandidateId: input.garmentCandidateId ?? null,
        status: "queued",
        errorMessage: null,
        detectedGarmentId: null,
      };
      jobs.set(job.id, job);
      return job;
    },
    async getPrettifyJob(jobId) {
      return jobs.get(jobId) ?? null;
    },
    async updatePrettifyJob(jobId, patch) {
      const existing = jobs.get(jobId);
      if (!existing) {
        throw new Error("Missing job");
      }

      const updated = { ...existing, ...patch };
      jobs.set(jobId, updated);
      return updated;
    },
    async getSourceImage(sourceImageId) {
      return sourceImages.get(sourceImageId) ?? null;
    },
    async createDetectedGarment(input) {
      createDetectedGarmentCount += 1;
      const garment: DetectedGarment = {
        id: `garment-real-${createDetectedGarmentCount}`,
        uploadBatchId: input.uploadBatchId,
        proposedName: input.proposedName,
        brand: "",
        category: input.category,
        ownerProfileId: "profile-aankur",
        sourceType: input.sourceType ?? "item_photo",
        confidence: input.confidence,
        prettifyStatus: input.prettifyStatus,
        isLayered: false,
        readyForMixer: input.readyForMixer,
        asset: input.asset,
        garmentCandidateId: input.garmentCandidateId,
        visibilityState: input.visibilityState,
      };
      detectedGarments.set(garment.id, garment);
      return garment;
    },
    async listDetectedGarmentsForBatch(batchId) {
      return Array.from(detectedGarments.values()).filter((garment) => garment.uploadBatchId === batchId);
    },
    async createGarmentCandidate(input) {
      candidateSequence += 1;
      const candidate: GarmentCandidateRecord = {
        id: `candidate-${candidateSequence}`,
        uploadBatchId: input.uploadBatchId,
        sourceImageId: input.sourceImageId,
        parentJobId: input.parentJobId,
        proposedName: input.proposedName,
        category: input.category,
        confidence: input.confidence,
        visibilityState: input.visibilityState,
        boundingBox: input.boundingBox,
        cropPrompt: input.cropPrompt,
        shouldPrettify: input.shouldPrettify,
        status: input.status,
        errorMessage: null,
        detectedGarmentId: null,
      };
      candidates.set(candidate.id, candidate);
      return candidate;
    },
    async getGarmentCandidate(candidateId) {
      return candidates.get(candidateId) ?? null;
    },
    async updateGarmentCandidate(candidateId, patch) {
      const existing = candidates.get(candidateId);
      if (!existing) {
        throw new Error("Missing candidate");
      }

      const updated = { ...existing, ...patch };
      candidates.set(candidateId, updated);
      return updated;
    },
    async getDetectedGarment(garmentId) {
      return detectedGarments.get(garmentId) ?? null;
    },
    async deleteDetectedGarment(garmentId) {
      detectedGarments.delete(garmentId);
    },
    async createWardrobeItem(input) {
      const item: WardrobeItem = {
        id: "wardrobe-real-1",
        sourceDetectedGarmentId: input.garment.id,
        name: input.garment.proposedName,
        brand: input.garment.brand,
        category: input.garment.category,
        ownerProfileId: input.garment.ownerProfileId,
        asset: input.garment.asset,
        addedAtIso: input.addedAtIso,
        readyForMixer: input.garment.readyForMixer,
      };
      wardrobeItems.push(item);
      return item;
    },
  };

  const storage: RealAssetStorage = {
    async uploadSourceImage(input) {
      return {
        bucket: "source-images",
        storagePath: `demo-household/profile-aankur/${input.file.name}`,
        signedUrl: "https://signed.example/source.png",
      };
    },
    async downloadSourceImage() {
      return { bytes: await createValidPngBytes(), contentType: "image/png" };
    },
    async uploadClosetAsset(input) {
      return {
        id: "asset-real-1",
        kind: "prettified",
        label: input.label,
        bucket: "closet-assets",
        storagePath: "demo-household/profile-aankur/asset-real-1.png",
        imageUrl: "https://signed.example/asset.png",
      };
    },
  };

  const ai: PrettifyAIProvider = {
    async analyzeGarment() {
      return {
        accepted: true,
        proposedName: "Blue Oxford Shirt",
        category: "tops",
        confidence: "high",
        readyForMixer: true,
      };
    },
    async prettifyGarment() {
      return { bytes: new Uint8Array([4, 5, 6]), contentType: "image/png" };
    },
    async validatePrettifiedAsset() {
      return { accepted: true };
    },
    async detectOutfitGarments() {
      return {
        candidates: [
          {
            proposedName: "Blue Denim Overshirt",
            category: "outerwear",
            confidence: "high",
            visibilityState: "visible",
            boundingBox: { x: 0.12, y: 0.08, width: 0.72, height: 0.45 },
            cropPrompt: "outer blue shirt layer",
            shouldPrettify: true,
          },
          {
            proposedName: "Black Travel Pants",
            category: "bottoms",
            confidence: "medium",
            visibilityState: "visible",
            boundingBox: { x: 0.22, y: 0.48, width: 0.42, height: 0.42 },
            cropPrompt: "black pants",
            shouldPrettify: true,
          },
          {
            proposedName: "Partially Hidden Watch",
            category: "accessories",
            confidence: "low",
            visibilityState: "occluded",
            boundingBox: { x: 0.58, y: 0.32, width: 0.08, height: 0.08 },
            cropPrompt: "watch",
            shouldPrettify: false,
          },
        ],
      };
    },
  };

  return {
    pipeline: new RealWardrobePipeline({ repository, storage, ai }),
    ai,
    jobs,
    detectedGarments,
    wardrobeItems,
    candidates,
    getCreateDetectedGarmentCount: () => createDetectedGarmentCount,
  };
}

describe("RealWardrobePipeline", () => {
  it("creates a source image, upload batch, and queued job", async () => {
    const { pipeline } = createHarness();

    const result = await pipeline.createSingleItemUpload(createUploadFile());

    expect(result.batch.id).toBe("batch-real-1");
    expect(result.job.status).toBe("queued");
    expect(result.sourceImage.signedUrl).toBe("https://signed.example/source.png");
  });

  it("creates an outfit upload with a parent outfit job", async () => {
    const { pipeline } = createHarness();

    const result = await pipeline.createOutfitUpload(createUploadFile({ name: "outfit.png" }));

    expect(result.batch.sourceType).toBe("outfit_photo");
    expect(result.job.jobKind).toBe("outfit_parent");
    expect(result.sourceImage.signedUrl).toBe("https://signed.example/source.png");
  });

  it("runs a job and creates one ready detected garment", async () => {
    const { pipeline } = createHarness();
    const { job } = await pipeline.createSingleItemUpload(createUploadFile());

    const result = await pipeline.runPrettifyJob(job.id);

    expect(result.job.status).toBe("ready");
    expect(result.garment?.proposedName).toBe("Blue Oxford Shirt");
    expect(result.garment?.prettifyStatus).toBe("ready");
    expect(result.garment?.asset).toMatchObject({ imageUrl: "https://signed.example/asset.png" });
  });

  it("runs an outfit parent job and creates garments for eligible candidates only", async () => {
    const { pipeline, candidates } = createHarness();
    const { job } = await pipeline.createOutfitUpload(createUploadFile({ name: "outfit.png" }));

    const result = await pipeline.runPrettifyJob(job.id);

    expect(result.job.status).toBe("ready");
    expect(result.garments.map((garment) => garment.proposedName)).toEqual([
      "Blue Denim Overshirt",
      "Black Travel Pants",
    ]);
    expect(result.garments.every((garment) => garment.sourceType === "outfit_photo")).toBe(true);
    expect(Array.from(candidates.values()).map((candidate) => candidate.status)).toEqual([
      "ready",
      "ready",
      "skipped",
    ]);
  });

  it("marks a job failed when the AI provider throws", async () => {
    const harness = createHarness();
    harness.ai.analyzeGarment = async () => {
      throw new Error("OpenAI unavailable");
    };
    const { job } = await harness.pipeline.createSingleItemUpload(createUploadFile());

    const result = await harness.pipeline.runPrettifyJob(job.id);

    expect(result.job.status).toBe("failed");
    expect(result.job.errorMessage).toBe("OpenAI unavailable");
  });

  it("returns an existing ready garment without creating a duplicate", async () => {
    const harness = createHarness();
    const { job } = await harness.pipeline.createSingleItemUpload(createUploadFile());

    const firstResult = await harness.pipeline.runPrettifyJob(job.id);
    const secondResult = await harness.pipeline.runPrettifyJob(job.id);

    expect(firstResult.garment?.id).toBe("garment-real-1");
    expect(secondResult.garment?.id).toBe("garment-real-1");
    expect(harness.getCreateDetectedGarmentCount()).toBe(1);
  });

  it("reruns a failed job when retrying", async () => {
    const { pipeline, jobs } = createHarness();
    const { job } = await pipeline.createSingleItemUpload(createUploadFile());
    jobs.set(job.id, { ...job, status: "failed", errorMessage: "bad network", detectedGarmentId: null });

    const result = await pipeline.retryPrettifyJob(job.id);

    expect(result.job.status).toBe("ready");
    expect(result.garment?.id).toBe("garment-real-1");
  });

  it("adds a detected garment to closet and removes it from review", async () => {
    const { pipeline, detectedGarments, wardrobeItems } = createHarness();
    const { job } = await pipeline.createSingleItemUpload(createUploadFile());
    const { garment } = await pipeline.runPrettifyJob(job.id);

    const item = await pipeline.addDetectedGarmentToCloset(garment?.id ?? "", "2026-05-26T11:00:00.000Z");

    expect(item.name).toBe("Blue Oxford Shirt");
    expect(wardrobeItems).toHaveLength(1);
    expect(detectedGarments.size).toBe(0);
  });
});
