import type {
  ClosetAsset,
  ConfidenceLevel,
  CandidateSelectionStatus,
  DetectedGarment,
  GarmentBoundingBox,
  GarmentCategory,
  GarmentVisibilityState,
  OutfitExtractionMode,
  PrettifyJobStatus,
  PrettifyStatus,
  UploadBatch,
  UploadSourceType,
  WardrobeItem,
} from "@/src/domain/wardrobe";
import {
  cropGarmentCandidateImage,
  planOutfitExtraction,
  type GarmentCandidateStatus,
  type OutfitGarmentCandidateAnalysis,
} from "./outfitGarmentCandidates";
import { getTerminalPrettifyStatus } from "./prettifyJobStatus";
import { createTimer, logWearaboutsTelemetry } from "./prettifyTelemetry";
import { createGeneratedGarmentCacheKey, type PrettifyCacheConfig } from "./generatedGarmentCacheKey";

export type PrettifyJobKind = "single_item" | "outfit_parent" | "outfit_candidate";

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
  contentHash: string;
  contentType: string;
  originalFilename: string;
}

export interface PrettifyJobRecord {
  id: string;
  uploadBatchId: string;
  sourceImageId: string;
  jobKind: PrettifyJobKind;
  parentJobId: string | null;
  garmentCandidateId: string | null;
  status: PrettifyJobStatus;
  errorMessage: string | null;
  detectedGarmentId: string | null;
}

export interface GarmentCandidateRecord {
  id: string;
  uploadBatchId: string;
  sourceImageId: string;
  parentJobId: string;
  proposedName: string;
  category: GarmentCategory;
  confidence: ConfidenceLevel;
  visibilityState: GarmentVisibilityState;
  boundingBox: GarmentBoundingBox;
  cropPrompt: string;
  shouldPrettify: boolean;
  selectionStatus: CandidateSelectionStatus;
  selectionReason: string;
  duplicateHint: boolean;
  status: GarmentCandidateStatus;
  errorMessage: string | null;
  detectedGarmentId: string | null;
}

export interface GarmentAnalysisResult {
  accepted: boolean;
  proposedName: string;
  category: GarmentCategory;
  confidence: ConfidenceLevel;
  readyForMixer: boolean;
  cropPrompt?: string;
}

export interface GeneratedImageResult {
  bytes: Uint8Array;
  contentType: "image/png";
  qualityNotes: string[];
}

export interface GeneratedGarmentCacheRecord {
  id: string;
  cacheKey: string;
  asset: ClosetAsset;
  qualityNotes: string[];
}

export interface ValidationResult {
  accepted: boolean;
}

export interface OutfitDetectionResult {
  candidates: OutfitGarmentCandidateAnalysis[];
}

export interface RealWardrobeRepository {
  createUploadBatch: (input: {
    sourceType: Extract<UploadSourceType, "item_photo" | "outfit_photo">;
    title: string;
    extractionMode?: OutfitExtractionMode;
    skipExistingItems?: boolean;
  }) => Promise<UploadBatch>;
  createSourceImage: (input: Omit<RealSourceImageRecord, "id">) => Promise<RealSourceImageRecord>;
  createPrettifyJob: (input: {
    uploadBatchId: string;
    sourceImageId: string;
    jobKind?: PrettifyJobKind;
    parentJobId?: string | null;
    garmentCandidateId?: string | null;
  }) => Promise<PrettifyJobRecord>;
  getPrettifyJob: (jobId: string) => Promise<PrettifyJobRecord | null>;
  updatePrettifyJob: (jobId: string, patch: Partial<PrettifyJobRecord>) => Promise<PrettifyJobRecord>;
  getUploadBatch: (batchId: string) => Promise<UploadBatch | null>;
  getSourceImage: (sourceImageId: string) => Promise<RealSourceImageRecord | null>;
  createGarmentCandidate: (input: Omit<GarmentCandidateRecord, "id" | "errorMessage" | "detectedGarmentId">) => Promise<GarmentCandidateRecord>;
  getGarmentCandidate: (candidateId: string) => Promise<GarmentCandidateRecord | null>;
  listGarmentCandidatesForBatch: (batchId: string) => Promise<GarmentCandidateRecord[]>;
  updateGarmentCandidate: (candidateId: string, patch: Partial<GarmentCandidateRecord>) => Promise<GarmentCandidateRecord>;
  getGeneratedGarmentCache: (cacheKey: string) => Promise<GeneratedGarmentCacheRecord | null>;
  createGeneratedGarmentCache: (input: {
    cacheKey: string;
    asset: ClosetAsset;
    qualityNotes: string[];
  }) => Promise<GeneratedGarmentCacheRecord>;
  createDetectedGarment: (input: {
    uploadBatchId: string;
    proposedName: string;
    category: GarmentCategory;
    confidence: ConfidenceLevel;
    prettifyStatus: PrettifyStatus;
    readyForMixer: boolean;
    asset: ClosetAsset;
    sourceType?: Extract<UploadSourceType, "item_photo" | "outfit_photo">;
    sourceImageId?: string;
    garmentCandidateId?: string;
    visibilityState?: GarmentVisibilityState;
    sourceBoundingBox?: GarmentBoundingBox;
  }) => Promise<DetectedGarment>;
  getDetectedGarment: (garmentId: string) => Promise<DetectedGarment | null>;
  listDetectedGarmentsForBatch: (batchId: string) => Promise<DetectedGarment[]>;
  deleteDetectedGarment: (garmentId: string) => Promise<void>;
  createWardrobeItem: (input: { garment: DetectedGarment; addedAtIso: string }) => Promise<WardrobeItem>;
  deleteWardrobeItem: (wardrobeItemId: string) => Promise<void>;
  listWardrobeItems: () => Promise<WardrobeItem[]>;
}

export interface RealAssetStorage {
  uploadSourceImage: (input: { file: RealUploadFile; uploadBatchId: string }) => Promise<{
    bucket: "source-images";
    storagePath: string;
    signedUrl: string;
    contentHash: string;
  }>;
  downloadSourceImage: (sourceImage: RealSourceImageRecord) => Promise<{ bytes: Uint8Array; contentType: string }>;
  uploadClosetAsset: (input: { bytes: Uint8Array; contentType: "image/png"; label: string }) => Promise<ClosetAsset>;
}

export interface PrettifyAIProvider {
  getPrettifyCacheConfig: () => PrettifyCacheConfig;
  analyzeGarment: (input: { sourceImage: RealSourceImageRecord; bytes: Uint8Array }) => Promise<GarmentAnalysisResult>;
  detectOutfitGarments: (input: { sourceImage: RealSourceImageRecord; bytes: Uint8Array }) => Promise<OutfitDetectionResult>;
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
    return this.createStoredUpload(file, "item_photo", "single_item");
  }

  async createOutfitUpload(
    file: RealUploadFile,
    options: { extractionMode?: OutfitExtractionMode; skipExistingItems?: boolean } = {},
  ) {
    return this.createStoredUpload(file, "outfit_photo", "outfit_parent", {
      extractionMode: options.extractionMode ?? "pick_after_scan",
      skipExistingItems: options.skipExistingItems ?? true,
    });
  }

  async runPrettifyJob(jobId: string): Promise<{
    job: PrettifyJobRecord;
    garment: DetectedGarment | null;
    garments: DetectedGarment[];
  }> {
    const job = await this.requireJob(jobId);
    const timer = createTimer();
    logWearaboutsTelemetry("pipeline.job.started", {
      jobId: job.id,
      batchId: job.uploadBatchId,
      jobKind: job.jobKind,
      status: job.status,
    });
    const run = async () => {
    if (job.jobKind === "outfit_parent") {
      return this.runOutfitParentJob(job);
    }
    if (job.jobKind === "outfit_candidate") {
      return this.runOutfitCandidateJob(job);
    }

    return this.runSingleItemJob(job);
    };
    const result = await run();
    logWearaboutsTelemetry("pipeline.job.completed", {
      jobId: job.id,
      batchId: job.uploadBatchId,
      jobKind: job.jobKind,
      finalStatus: result.job.status,
      generatedGarmentCount: result.garments.length,
      durationMs: timer.elapsedMs(),
    });
    return result;
  }

  async retryPrettifyJob(jobId: string) {
    const existingJob = await this.requireJob(jobId);
    await this.repository.updatePrettifyJob(jobId, {
      status: "queued",
      errorMessage: null,
      detectedGarmentId: null,
    });

    if (existingJob.garmentCandidateId) {
      await this.repository.updateGarmentCandidate(existingJob.garmentCandidateId, {
        status: "detected",
        errorMessage: null,
        detectedGarmentId: null,
      });
    }

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

  async deleteWardrobeItem(wardrobeItemId: string): Promise<void> {
    await this.repository.deleteWardrobeItem(wardrobeItemId);
  }

  async generateOutfitCandidates(parentJobId: string, candidateIds: string[]) {
    const timer = createTimer();
    const parentJob = await this.requireJob(parentJobId);
    if (parentJob.jobKind !== "outfit_parent") {
      throw new Error("Selected candidate generation requires an outfit parent job.");
    }

    const sourceImage = await this.requireSourceImage(parentJob.sourceImageId);
    const source = await this.storage.downloadSourceImage(sourceImage);
    logWearaboutsTelemetry("pipeline.selected_candidates.started", {
      parentJobId,
      batchId: parentJob.uploadBatchId,
      selectedCandidateCount: candidateIds.length,
      candidateIds,
    });
    const candidateJobs = await Promise.all(
      candidateIds.map(async (candidateId) => {
        const candidate = await this.repository.getGarmentCandidate(candidateId);
        if (!candidate || candidate.uploadBatchId !== parentJob.uploadBatchId) {
          throw new Error("Selected garment candidate was not found.");
        }
        if (candidate.status === "ready") {
          return null;
        }

        await this.repository.updateGarmentCandidate(candidate.id, {
          selectionStatus: "selected",
          selectionReason: "Selected for preparation",
        });

        return this.repository.createPrettifyJob({
          uploadBatchId: parentJob.uploadBatchId,
          sourceImageId: parentJob.sourceImageId,
          jobKind: "outfit_candidate",
          parentJobId: parentJob.id,
          garmentCandidateId: candidate.id,
        });
      }),
    );

    await this.repository.updatePrettifyJob(parentJob.id, { status: "prettifying", errorMessage: null });
    const results = await this.runWithConcurrency(
      candidateJobs.filter((candidateJob): candidateJob is PrettifyJobRecord => Boolean(candidateJob)),
      2,
      (candidateJob) => this.runOutfitCandidateJobWithSource(candidateJob, sourceImage, source.bytes),
    );
    const generatedGarments = results.flatMap((result) => result.garments);
    const existingGarments = await this.repository.listDetectedGarmentsForBatch(parentJob.uploadBatchId);
    const garments = mergeGarments(existingGarments, generatedGarments);
    const readyJob = await this.repository.updatePrettifyJob(parentJob.id, { status: "ready", errorMessage: null });
    logWearaboutsTelemetry("pipeline.selected_candidates.completed", {
      parentJobId,
      batchId: parentJob.uploadBatchId,
      generatedGarmentCount: generatedGarments.length,
      totalReviewGarmentCount: garments.length,
      durationMs: timer.elapsedMs(),
    });

    return { job: readyJob, garment: garments[0] ?? null, garments };
  }

  private async createStoredUpload(
    file: RealUploadFile,
    sourceType: Extract<UploadSourceType, "item_photo" | "outfit_photo">,
    jobKind: PrettifyJobKind,
    options: { extractionMode?: OutfitExtractionMode; skipExistingItems?: boolean } = {},
  ) {
    this.assertValidImage(file);

    const batch = await this.repository.createUploadBatch({
      sourceType,
      title: file.name,
      extractionMode: options.extractionMode ?? (sourceType === "outfit_photo" ? "pick_after_scan" : "single_item"),
      skipExistingItems: options.skipExistingItems ?? true,
    });
    const storedSource = await this.storage.uploadSourceImage({ file, uploadBatchId: batch.id });
    const sourceImage = await this.repository.createSourceImage({
      uploadBatchId: batch.id,
      bucket: storedSource.bucket,
      storagePath: storedSource.storagePath,
      signedUrl: storedSource.signedUrl,
      contentHash: storedSource.contentHash,
      contentType: file.type,
      originalFilename: file.name,
    });
    const job = await this.repository.createPrettifyJob({
      uploadBatchId: batch.id,
      sourceImageId: sourceImage.id,
      jobKind,
    });

    return { batch, sourceImage, job };
  }

  private async runSingleItemJob(job: PrettifyJobRecord) {
    if (job.status === "ready" && job.detectedGarmentId) {
      const existingGarment = await this.repository.getDetectedGarment(job.detectedGarmentId);
      if (existingGarment) {
        return { job, garment: existingGarment, garments: [existingGarment] };
      }
    }

    const sourceImage = await this.requireSourceImage(job.sourceImageId);

    try {
      await this.repository.updatePrettifyJob(job.id, { status: "analyzing", errorMessage: null });
      const source = await this.storage.downloadSourceImage(sourceImage);
      const analysis = await this.ai.analyzeGarment({ sourceImage, bytes: source.bytes });

      await this.repository.updatePrettifyJob(job.id, { status: "prettifying" });
      const generated = await this.ai.prettifyGarment({ sourceImage, bytes: source.bytes, analysis });
      this.logGeneratedAssetQuality(job, analysis.proposedName, generated.qualityNotes);

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
        sourceType: "item_photo",
        sourceImageId: sourceImage.id,
      });
      const readyJob = await this.repository.updatePrettifyJob(job.id, {
        status: "ready",
        errorMessage: null,
        detectedGarmentId: garment.id,
      });

      return { job: readyJob, garment, garments: [garment] };
    } catch (error) {
      const failedJob = await this.repository.updatePrettifyJob(job.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Wardrobe Prep failed",
      });

      return { job: failedJob, garment: null, garments: [] };
    }
  }

  private async runOutfitParentJob(job: PrettifyJobRecord) {
    if (job.status === "ready") {
      const existingGarments = await this.repository.listDetectedGarmentsForBatch(job.uploadBatchId);
      if (existingGarments.length > 0) {
        return { job, garment: existingGarments[0] ?? null, garments: existingGarments };
      }
      const existingCandidates = await this.repository.listGarmentCandidatesForBatch(job.uploadBatchId);
      if (existingCandidates.length > 0) {
        return { job, garment: null, garments: [] };
      }
    }

    const sourceImage = await this.requireSourceImage(job.sourceImageId);

    try {
      await this.repository.updatePrettifyJob(job.id, { status: "analyzing", errorMessage: null });
      const source = await this.storage.downloadSourceImage(sourceImage);
      const detection = await this.ai.detectOutfitGarments({ sourceImage, bytes: source.bytes });
      const batch = await this.repository.getUploadBatch(job.uploadBatchId);
      const extractionMode = getOutfitExtractionMode(batch?.extractionMode);
      const existingClosetItems = await this.getExistingClosetItemsForDuplicateCheck(job);
      const plannedCandidates = planOutfitExtraction({
        candidates: detection.candidates,
        mode: extractionMode,
        skipExistingItems: batch?.skipExistingItems ?? true,
        existingClosetItems,
      });
      logWearaboutsTelemetry("pipeline.outfit_detection.planned", {
        jobId: job.id,
        batchId: job.uploadBatchId,
        extractionMode,
        skipExistingItems: batch?.skipExistingItems ?? true,
        detectedCandidateCount: detection.candidates.length,
        selectedCandidateCount: plannedCandidates.filter((candidate) => candidate.shouldGenerate).length,
        primaryCandidateCount: plannedCandidates.filter((candidate) => candidate.selectionStatus === "primary").length,
        optionalCandidateCount: plannedCandidates.filter((candidate) => candidate.selectionStatus === "optional").length,
        skippedExistingCount: plannedCandidates.filter((candidate) => candidate.selectionStatus === "skipped_existing").length,
        notRecommendedCount: plannedCandidates.filter((candidate) => candidate.selectionStatus === "not_recommended").length,
        categories: plannedCandidates.map((candidate) => ({
          proposedName: candidate.proposedName,
          category: candidate.category,
          selectionStatus: candidate.selectionStatus,
          shouldGenerate: candidate.shouldGenerate,
          duplicateHint: candidate.duplicateHint,
        })),
      });

      await this.repository.updatePrettifyJob(job.id, { status: "prettifying" });
      const candidateJobs = await Promise.all(
        plannedCandidates.map(async (candidateAnalysis) => {
          const candidate = await this.repository.createGarmentCandidate({
            uploadBatchId: job.uploadBatchId,
            sourceImageId: sourceImage.id,
            parentJobId: job.id,
            proposedName: candidateAnalysis.proposedName,
            category: candidateAnalysis.category,
            confidence: candidateAnalysis.confidence,
            visibilityState: candidateAnalysis.visibilityState,
            boundingBox: candidateAnalysis.boundingBox,
            cropPrompt: candidateAnalysis.cropPrompt,
            shouldPrettify: candidateAnalysis.shouldPrettify,
            selectionStatus: candidateAnalysis.selectionStatus,
            selectionReason: candidateAnalysis.selectionReason,
            duplicateHint: candidateAnalysis.duplicateHint,
            status: "detected",
          });

          if (!candidateAnalysis.shouldGenerate) {
            return null;
          }

          return this.repository.createPrettifyJob({
            uploadBatchId: job.uploadBatchId,
            sourceImageId: sourceImage.id,
            jobKind: "outfit_candidate",
            parentJobId: job.id,
            garmentCandidateId: candidate.id,
          });
        }),
      );

      const selectedJobs = candidateJobs.filter((candidateJob): candidateJob is PrettifyJobRecord => Boolean(candidateJob));
      if (selectedJobs.length === 0) {
        const readyJob = await this.repository.updatePrettifyJob(job.id, { status: "ready", errorMessage: null });
        logWearaboutsTelemetry("pipeline.outfit_detection.ready_for_picker", {
          jobId: job.id,
          batchId: job.uploadBatchId,
          candidateCount: plannedCandidates.length,
        });
        return { job: readyJob, garment: null, garments: [] };
      }

      await this.repository.updatePrettifyJob(job.id, { status: "validating" });
      const results = await this.runWithConcurrency(selectedJobs, 2, (candidateJob) =>
        this.runOutfitCandidateJobWithSource(candidateJob, sourceImage, source.bytes),
      );
      const generatedGarments = results.flatMap((result) => result.garments);

      if (generatedGarments.length === 0) {
        const failedJob = await this.repository.updatePrettifyJob(job.id, {
          status: "failed",
          errorMessage: "No reviewable garments were generated from this outfit photo.",
        });
        return { job: failedJob, garment: null, garments: [] };
      }

      const readyJob = await this.repository.updatePrettifyJob(job.id, { status: "ready", errorMessage: null });
      return { job: readyJob, garment: generatedGarments[0] ?? null, garments: generatedGarments };
    } catch (error) {
      const failedJob = await this.repository.updatePrettifyJob(job.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Outfit decomposition failed",
      });

      return { job: failedJob, garment: null, garments: [] };
    }
  }

  private async runOutfitCandidateJob(job: PrettifyJobRecord) {
    const sourceImage = await this.requireSourceImage(job.sourceImageId);
    const source = await this.storage.downloadSourceImage(sourceImage);
    return this.runOutfitCandidateJobWithSource(job, sourceImage, source.bytes);
  }

  private async runOutfitCandidateJobWithSource(
    job: PrettifyJobRecord,
    sourceImage: RealSourceImageRecord,
    sourceBytes: Uint8Array,
  ) {
    if (job.status === "ready" && job.detectedGarmentId) {
      const existingGarment = await this.repository.getDetectedGarment(job.detectedGarmentId);
      if (existingGarment) {
        return { job, garment: existingGarment, garments: [existingGarment] };
      }
    }
    if (!job.garmentCandidateId) {
      throw new Error("Outfit candidate job is missing candidate metadata.");
    }

    const candidate = await this.repository.getGarmentCandidate(job.garmentCandidateId);
    if (!candidate) {
      throw new Error("Garment candidate not found.");
    }

    try {
      await this.repository.updatePrettifyJob(job.id, { status: "prettifying", errorMessage: null });
      await this.repository.updateGarmentCandidate(candidate.id, { status: "prettifying", errorMessage: null });
      logWearaboutsTelemetry("pipeline.candidate_generation.started", {
        jobId: job.id,
        batchId: job.uploadBatchId,
        candidateId: candidate.id,
        proposedName: candidate.proposedName,
        category: candidate.category,
        confidence: candidate.confidence,
        visibilityState: candidate.visibilityState,
      });
      const timer = createTimer();
      const cacheKey = createGeneratedGarmentCacheKey({
        sourceImageHash: sourceImage.contentHash,
        boundingBox: candidate.boundingBox,
        category: candidate.category,
        config: this.ai.getPrettifyCacheConfig(),
      });
      const cached = await this.repository.getGeneratedGarmentCache(cacheKey);
      if (cached) {
        const garment = await this.repository.createDetectedGarment({
          uploadBatchId: job.uploadBatchId,
          proposedName: candidate.proposedName,
          category: candidate.category,
          confidence: candidate.confidence,
          prettifyStatus: "ready",
          readyForMixer: true,
          asset: cached.asset,
          sourceType: "outfit_photo",
          sourceImageId: sourceImage.id,
          garmentCandidateId: candidate.id,
          visibilityState: candidate.visibilityState,
          sourceBoundingBox: candidate.boundingBox,
        });
        await this.repository.updateGarmentCandidate(candidate.id, {
          status: "ready",
          errorMessage: null,
          detectedGarmentId: garment.id,
        });
        const readyJob = await this.repository.updatePrettifyJob(job.id, {
          status: "ready",
          errorMessage: null,
          detectedGarmentId: garment.id,
        });
        logWearaboutsTelemetry("pipeline.candidate_generation.cache_hit", {
          jobId: job.id,
          batchId: job.uploadBatchId,
          candidateId: candidate.id,
          proposedName: candidate.proposedName,
          category: candidate.category,
          cacheKey,
          durationMs: timer.elapsedMs(),
        });

        return { job: readyJob, garment, garments: [garment] };
      }

      logWearaboutsTelemetry("pipeline.candidate_generation.cache_miss", {
        jobId: job.id,
        batchId: job.uploadBatchId,
        candidateId: candidate.id,
        proposedName: candidate.proposedName,
        category: candidate.category,
        cacheKey,
      });
      const cropBytes = await cropGarmentCandidateImage(sourceBytes, candidate.boundingBox, {
        category: candidate.category,
      });
      const analysis: GarmentAnalysisResult = {
        accepted: true,
        proposedName: candidate.proposedName,
        category: candidate.category,
        confidence: candidate.confidence,
        readyForMixer: true,
        cropPrompt: candidate.cropPrompt,
      };
      const generated = await this.ai.prettifyGarment({ sourceImage, bytes: cropBytes, analysis });
      this.logGeneratedAssetQuality(job, candidate.proposedName, generated.qualityNotes);

      await this.repository.updatePrettifyJob(job.id, { status: "validating" });
      const shouldValidate = this.shouldValidateOutfitCandidate(candidate);
      const validation = shouldValidate
        ? await this.ai.validatePrettifiedAsset({
            sourceImage,
            sourceBytes: cropBytes,
            assetBytes: generated.bytes,
            analysis,
          })
        : { accepted: true };
      if (!shouldValidate) {
        logWearaboutsTelemetry("pipeline.validation.skipped", {
          jobId: job.id,
          batchId: job.uploadBatchId,
          candidateId: candidate.id,
          proposedName: candidate.proposedName,
          reason: "high_confidence_visible_core",
        });
      }
      const asset = await this.storage.uploadClosetAsset({
        bytes: generated.bytes,
        contentType: generated.contentType,
        label: `${candidate.proposedName} studio asset`,
      });
      await this.cacheGeneratedAsset({
        job,
        candidate,
        cacheKey,
        asset,
        qualityNotes: generated.qualityNotes,
      });
      const garment = await this.repository.createDetectedGarment({
        uploadBatchId: job.uploadBatchId,
        proposedName: candidate.proposedName,
        category: candidate.category,
        confidence: candidate.confidence,
        prettifyStatus: getTerminalPrettifyStatus("ready", validation.accepted),
        readyForMixer: validation.accepted,
        asset,
        sourceType: "outfit_photo",
        sourceImageId: sourceImage.id,
        garmentCandidateId: candidate.id,
        visibilityState: candidate.visibilityState,
        sourceBoundingBox: candidate.boundingBox,
      });
      await this.repository.updateGarmentCandidate(candidate.id, {
        status: "ready",
        errorMessage: null,
        detectedGarmentId: garment.id,
      });
      const readyJob = await this.repository.updatePrettifyJob(job.id, {
        status: "ready",
        errorMessage: null,
        detectedGarmentId: garment.id,
      });
      logWearaboutsTelemetry("pipeline.candidate_generation.completed", {
        jobId: job.id,
        batchId: job.uploadBatchId,
        candidateId: candidate.id,
        proposedName: candidate.proposedName,
        category: candidate.category,
        validationAccepted: validation.accepted,
        durationMs: timer.elapsedMs(),
      });

      return { job: readyJob, garment, garments: [garment] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Garment preparation failed";
      logWearaboutsTelemetry("pipeline.candidate_generation.failed", {
        jobId: job.id,
        batchId: job.uploadBatchId,
        candidateId: candidate.id,
        proposedName: candidate.proposedName,
        category: candidate.category,
        error: message,
      });
      await this.repository.updateGarmentCandidate(candidate.id, { status: "failed", errorMessage: message });
      const failedJob = await this.repository.updatePrettifyJob(job.id, {
        status: "failed",
        errorMessage: message,
      });

      return { job: failedJob, garment: null, garments: [] };
    }
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
      throw new Error("Processing job not found");
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

  private shouldValidateOutfitCandidate(candidate: GarmentCandidateRecord): boolean {
    return !(
      candidate.confidence === "high" &&
      candidate.visibilityState === "visible" &&
      (candidate.category === "tops" || candidate.category === "outerwear" || candidate.category === "bottoms")
    );
  }

  private logGeneratedAssetQuality(job: PrettifyJobRecord, proposedName: string, qualityNotes: string[]) {
    if (qualityNotes.length === 0) {
      return;
    }

    logWearaboutsTelemetry("pipeline.generated_asset.quality_note", {
      jobId: job.id,
      batchId: job.uploadBatchId,
      jobKind: job.jobKind,
      garmentCandidateId: job.garmentCandidateId,
      proposedName,
      qualityNotes,
    });
  }

  private async cacheGeneratedAsset(input: {
    job: PrettifyJobRecord;
    candidate: GarmentCandidateRecord;
    cacheKey: string;
    asset: ClosetAsset;
    qualityNotes: string[];
  }) {
    try {
      await this.repository.createGeneratedGarmentCache({
        cacheKey: input.cacheKey,
        asset: input.asset,
        qualityNotes: input.qualityNotes,
      });
      logWearaboutsTelemetry("pipeline.candidate_generation.cache_saved", {
        jobId: input.job.id,
        batchId: input.job.uploadBatchId,
        candidateId: input.candidate.id,
        proposedName: input.candidate.proposedName,
        category: input.candidate.category,
        cacheKey: input.cacheKey,
      });
    } catch (error) {
      logWearaboutsTelemetry("pipeline.candidate_generation.cache_save_failed", {
        jobId: input.job.id,
        batchId: input.job.uploadBatchId,
        candidateId: input.candidate.id,
        proposedName: input.candidate.proposedName,
        category: input.candidate.category,
        cacheKey: input.cacheKey,
        error: error instanceof Error ? error.message : "Could not save generated garment cache.",
      });
    }
  }

  private async getExistingClosetItemsForDuplicateCheck(job: PrettifyJobRecord): Promise<WardrobeItem[]> {
    try {
      return await this.repository.listWardrobeItems();
    } catch (error) {
      logWearaboutsTelemetry("pipeline.outfit_detection.duplicate_lookup_failed", {
        jobId: job.id,
        batchId: job.uploadBatchId,
        error: error instanceof Error ? error.message : "Could not load wardrobe items for duplicate detection.",
      });
      return [];
    }
  }

  private async runWithConcurrency<TInput, TResult>(
    items: TInput[],
    concurrency: number,
    run: (item: TInput) => Promise<TResult>,
  ): Promise<TResult[]> {
    const results: TResult[] = [];
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await run(items[currentIndex]);
      }
    });

    await Promise.all(workers);
    return results;
  }
}

function getOutfitExtractionMode(
  mode: OutfitExtractionMode | undefined,
): Extract<OutfitExtractionMode, "pick_after_scan" | "new_tops" | "new_bottoms" | "core_outfit"> {
  if (mode === "new_tops" || mode === "new_bottoms" || mode === "core_outfit") {
    return mode;
  }

  return "pick_after_scan";
}

function mergeGarments(existingGarments: DetectedGarment[], generatedGarments: DetectedGarment[]): DetectedGarment[] {
  const garmentsById = new Map(existingGarments.map((garment) => [garment.id, garment]));
  for (const garment of generatedGarments) {
    garmentsById.set(garment.id, garment);
  }

  return Array.from(garmentsById.values());
}
