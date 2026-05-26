import { describe, expect, it } from "vitest";
import type {
  PrettifyAIProvider,
  PrettifyJobRecord,
  RealAssetStorage,
  RealSourceImageRecord,
  RealUploadFile,
  RealWardrobeRepository,
} from "./realWardrobePipeline";
import { RealWardrobePipeline } from "./realWardrobePipeline";
import type { DetectedGarment, WardrobeItem } from "@/src/domain/wardrobe";

function createUploadFile(overrides: Partial<RealUploadFile> = {}): RealUploadFile {
  const bytes = new Uint8Array([1, 2, 3]);

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
  const detectedGarments = new Map<string, DetectedGarment>();
  const wardrobeItems: WardrobeItem[] = [];

  const repository: RealWardrobeRepository = {
    async createUploadBatch(input) {
      return {
        id: "batch-real-1",
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
      const job: PrettifyJobRecord = {
        id: "job-real-1",
        uploadBatchId: input.uploadBatchId,
        sourceImageId: input.sourceImageId,
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
      const garment: DetectedGarment = {
        id: "garment-real-1",
        uploadBatchId: input.uploadBatchId,
        proposedName: input.proposedName,
        brand: "",
        category: input.category,
        ownerProfileId: "profile-aankur",
        sourceType: "item_photo",
        confidence: input.confidence,
        prettifyStatus: input.prettifyStatus,
        isLayered: false,
        readyForMixer: input.readyForMixer,
        asset: input.asset,
      };
      detectedGarments.set(garment.id, garment);
      return garment;
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
      return { bytes: new Uint8Array([1, 2, 3]), contentType: "image/png" };
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
  };

  return { pipeline: new RealWardrobePipeline({ repository, storage, ai }), ai, jobs, detectedGarments, wardrobeItems };
}

describe("RealWardrobePipeline", () => {
  it("creates a source image, upload batch, and queued job", async () => {
    const { pipeline } = createHarness();

    const result = await pipeline.createSingleItemUpload(createUploadFile());

    expect(result.batch.id).toBe("batch-real-1");
    expect(result.job.status).toBe("queued");
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
