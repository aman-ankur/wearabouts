import type {
  ClosetAsset,
  ConfidenceLevel,
  DetectedGarment,
  GarmentCategory,
  PrettifyJobStatus,
  PrettifyStatus,
  UploadBatch,
  WardrobeItem,
} from "@/src/domain/wardrobe";
import { getTerminalPrettifyStatus } from "./prettifyJobStatus";

export interface RealUploadFile {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export interface RealSourceImageRecord {
  id: string;
  uploadBatchId: string;
  bucket: "source-images";
  storagePath: string;
  signedUrl: string;
  contentType: string;
  originalFilename: string;
}

export interface PrettifyJobRecord {
  id: string;
  uploadBatchId: string;
  sourceImageId: string;
  status: PrettifyJobStatus;
  errorMessage: string | null;
  detectedGarmentId: string | null;
}

export interface GarmentAnalysisResult {
  accepted: boolean;
  proposedName: string;
  category: GarmentCategory;
  confidence: ConfidenceLevel;
  readyForMixer: boolean;
}

export interface GeneratedImageResult {
  bytes: Uint8Array;
  contentType: "image/png";
}

export interface ValidationResult {
  accepted: boolean;
}

export interface RealWardrobeRepository {
  createUploadBatch: (input: { sourceType: "item_photo"; title: string }) => Promise<UploadBatch>;
  createSourceImage: (input: Omit<RealSourceImageRecord, "id">) => Promise<RealSourceImageRecord>;
  createPrettifyJob: (input: { uploadBatchId: string; sourceImageId: string }) => Promise<PrettifyJobRecord>;
  getPrettifyJob: (jobId: string) => Promise<PrettifyJobRecord | null>;
  updatePrettifyJob: (jobId: string, patch: Partial<PrettifyJobRecord>) => Promise<PrettifyJobRecord>;
  getSourceImage: (sourceImageId: string) => Promise<RealSourceImageRecord | null>;
  createDetectedGarment: (input: {
    uploadBatchId: string;
    proposedName: string;
    category: GarmentCategory;
    confidence: ConfidenceLevel;
    prettifyStatus: PrettifyStatus;
    readyForMixer: boolean;
    asset: ClosetAsset;
  }) => Promise<DetectedGarment>;
  getDetectedGarment: (garmentId: string) => Promise<DetectedGarment | null>;
  deleteDetectedGarment: (garmentId: string) => Promise<void>;
  createWardrobeItem: (input: { garment: DetectedGarment; addedAtIso: string }) => Promise<WardrobeItem>;
}

export interface RealAssetStorage {
  uploadSourceImage: (input: { file: RealUploadFile; uploadBatchId: string }) => Promise<{
    bucket: "source-images";
    storagePath: string;
    signedUrl: string;
  }>;
  downloadSourceImage: (sourceImage: RealSourceImageRecord) => Promise<{ bytes: Uint8Array; contentType: string }>;
  uploadClosetAsset: (input: { bytes: Uint8Array; contentType: "image/png"; label: string }) => Promise<ClosetAsset>;
}

export interface PrettifyAIProvider {
  analyzeGarment: (input: { sourceImage: RealSourceImageRecord; bytes: Uint8Array }) => Promise<GarmentAnalysisResult>;
  prettifyGarment: (input: {
    sourceImage: RealSourceImageRecord;
    bytes: Uint8Array;
    analysis: GarmentAnalysisResult;
  }) => Promise<GeneratedImageResult>;
  validatePrettifiedAsset: (input: {
    sourceImage: RealSourceImageRecord;
    sourceBytes: Uint8Array;
    assetBytes: Uint8Array;
    analysis: GarmentAnalysisResult;
  }) => Promise<ValidationResult>;
}

interface RealWardrobePipelineInput {
  repository: RealWardrobeRepository;
  storage: RealAssetStorage;
  ai: PrettifyAIProvider;
}

export class RealWardrobePipeline {
  private readonly repository: RealWardrobeRepository;
  private readonly storage: RealAssetStorage;
  private readonly ai: PrettifyAIProvider;

  constructor(input: RealWardrobePipelineInput) {
    this.repository = input.repository;
    this.storage = input.storage;
    this.ai = input.ai;
  }

  async createSingleItemUpload(file: RealUploadFile) {
    this.assertValidImage(file);

    const batch = await this.repository.createUploadBatch({
      sourceType: "item_photo",
      title: file.name,
    });
    const storedSource = await this.storage.uploadSourceImage({ file, uploadBatchId: batch.id });
    const sourceImage = await this.repository.createSourceImage({
      uploadBatchId: batch.id,
      bucket: storedSource.bucket,
      storagePath: storedSource.storagePath,
      signedUrl: storedSource.signedUrl,
      contentType: file.type,
      originalFilename: file.name,
    });
    const job = await this.repository.createPrettifyJob({ uploadBatchId: batch.id, sourceImageId: sourceImage.id });

    return { batch, sourceImage, job };
  }

  async runPrettifyJob(jobId: string): Promise<{ job: PrettifyJobRecord; garment: DetectedGarment | null }> {
    const job = await this.requireJob(jobId);
    const sourceImage = await this.requireSourceImage(job.sourceImageId);

    try {
      await this.repository.updatePrettifyJob(job.id, { status: "analyzing", errorMessage: null });
      const source = await this.storage.downloadSourceImage(sourceImage);
      const analysis = await this.ai.analyzeGarment({ sourceImage, bytes: source.bytes });

      await this.repository.updatePrettifyJob(job.id, { status: "prettifying" });
      const generated = await this.ai.prettifyGarment({ sourceImage, bytes: source.bytes, analysis });

      await this.repository.updatePrettifyJob(job.id, { status: "validating" });
      const validation = await this.ai.validatePrettifiedAsset({
        sourceImage,
        sourceBytes: source.bytes,
        assetBytes: generated.bytes,
        analysis,
      });
      const asset = await this.storage.uploadClosetAsset({
        bytes: generated.bytes,
        contentType: generated.contentType,
        label: `${analysis.proposedName} studio asset`,
      });
      const garment = await this.repository.createDetectedGarment({
        uploadBatchId: job.uploadBatchId,
        proposedName: analysis.proposedName,
        category: analysis.category,
        confidence: analysis.confidence,
        prettifyStatus: getTerminalPrettifyStatus("ready", analysis.accepted && validation.accepted),
        readyForMixer: analysis.readyForMixer && validation.accepted,
        asset,
      });
      const readyJob = await this.repository.updatePrettifyJob(job.id, {
        status: "ready",
        errorMessage: null,
        detectedGarmentId: garment.id,
      });

      return { job: readyJob, garment };
    } catch (error) {
      const failedJob = await this.repository.updatePrettifyJob(job.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Prettify job failed",
      });

      return { job: failedJob, garment: null };
    }
  }

  async retryPrettifyJob(jobId: string) {
    await this.repository.updatePrettifyJob(jobId, {
      status: "queued",
      errorMessage: null,
      detectedGarmentId: null,
    });

    return this.runPrettifyJob(jobId);
  }

  async addDetectedGarmentToCloset(garmentId: string, addedAtIso: string): Promise<WardrobeItem> {
    const garment = await this.repository.getDetectedGarment(garmentId);
    if (!garment) {
      throw new Error("Detected garment not found");
    }

    const wardrobeItem = await this.repository.createWardrobeItem({ garment, addedAtIso });
    await this.repository.deleteDetectedGarment(garment.id);
    return wardrobeItem;
  }

  private assertValidImage(file: RealUploadFile) {
    const validTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!validTypes.has(file.type)) {
      throw new Error("Upload a JPEG, PNG, or WebP clothing photo.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Upload an image smaller than 10 MB.");
    }
  }

  private async requireJob(jobId: string) {
    const job = await this.repository.getPrettifyJob(jobId);
    if (!job) {
      throw new Error("Prettify job not found");
    }

    return job;
  }

  private async requireSourceImage(sourceImageId: string) {
    const sourceImage = await this.repository.getSourceImage(sourceImageId);
    if (!sourceImage) {
      throw new Error("Source image not found");
    }

    return sourceImage;
  }
}
