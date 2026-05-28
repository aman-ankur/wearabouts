import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClosetAsset,
  CandidateSelectionStatus,
  DetectedGarment,
  GarmentBoundingBox,
  GarmentVisibilityState,
  OutfitExtractionMode,
  UploadBatch,
  UploadSourceType,
  WardrobeItem,
} from "@/src/domain/wardrobe";
import { summarizeOutfitCandidates, type GarmentCandidateStatus } from "./outfitGarmentCandidates";
import type {
  GarmentCandidateRecord,
  PrettifyJobKind,
  PrettifyJobRecord,
  RealSourceImageRecord,
  RealWardrobeRepository,
} from "./realWardrobePipeline";
import { REAL_HOUSEHOLD_ID, REAL_PROFILE_ID } from "./realWardrobeConfig";
import {
  mapSupabaseDetectedGarment,
  mapSupabaseUploadBatch,
  mapSupabaseWardrobeItem,
  type SupabaseDetectedGarmentRow,
  type SupabaseUploadBatchRow,
  type SupabaseWardrobeItemRow,
} from "./supabaseMappers";

interface SourceImageRow {
  id: string;
  upload_batch_id: string;
  bucket: "source-images";
  storage_path: string;
  content_type: string;
  original_filename: string;
}

interface PrettifyJobRow {
  id: string;
  upload_batch_id: string;
  source_image_id: string;
  job_kind?: PrettifyJobKind;
  parent_job_id?: string | null;
  garment_candidate_id?: string | null;
  status: PrettifyJobRecord["status"];
  error_message: string | null;
  detected_garment_id: string | null;
}

interface GarmentCandidateRow {
  id: string;
  upload_batch_id: string;
  source_image_id: string;
  parent_job_id: string;
  proposed_name: string;
  category: DetectedGarment["category"];
  confidence: DetectedGarment["confidence"];
  visibility_state: GarmentVisibilityState;
  bounding_box: GarmentBoundingBox;
  crop_prompt: string;
  should_prettify: boolean;
  selection_status?: CandidateSelectionStatus | null;
  selection_reason?: string | null;
  duplicate_hint?: boolean | null;
  status: GarmentCandidateStatus;
  error_message: string | null;
  detected_garment_id: string | null;
}

export class SupabaseRealWardrobeRepository implements RealWardrobeRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createUploadBatch(input: {
    sourceType: Extract<UploadSourceType, "item_photo" | "outfit_photo">;
    title: string;
    extractionMode?: OutfitExtractionMode;
    skipExistingItems?: boolean;
  }): Promise<UploadBatch> {
    const values = {
      household_id: REAL_HOUSEHOLD_ID,
      profile_id: REAL_PROFILE_ID,
      source_type: input.sourceType,
      extraction_mode: input.extractionMode ?? (input.sourceType === "outfit_photo" ? "pick_after_scan" : "single_item"),
      skip_existing_items: input.skipExistingItems ?? true,
      title: input.title,
    };

    const row = await this.insertSingleWithSchemaFallback<SupabaseUploadBatchRow>("upload_batches", values, [
      "extraction_mode",
      "skip_existing_items",
    ]);

    return mapSupabaseUploadBatch(row, []);
  }

  async createSourceImage(input: Omit<RealSourceImageRecord, "id">): Promise<RealSourceImageRecord> {
    const row = await this.insertSingle<SourceImageRow>("source_images", {
      household_id: REAL_HOUSEHOLD_ID,
      profile_id: REAL_PROFILE_ID,
      upload_batch_id: input.uploadBatchId,
      bucket: input.bucket,
      storage_path: input.storagePath,
      content_type: input.contentType,
      original_filename: input.originalFilename,
    });

    return {
      id: row.id,
      uploadBatchId: row.upload_batch_id,
      bucket: row.bucket,
      storagePath: row.storage_path,
      signedUrl: input.signedUrl,
      contentType: row.content_type,
      originalFilename: row.original_filename,
    };
  }

  async createPrettifyJob(input: {
    uploadBatchId: string;
    sourceImageId: string;
    jobKind?: PrettifyJobKind;
    parentJobId?: string | null;
    garmentCandidateId?: string | null;
  }): Promise<PrettifyJobRecord> {
    const row = await this.insertSingle<PrettifyJobRow>("prettify_jobs", {
      household_id: REAL_HOUSEHOLD_ID,
      profile_id: REAL_PROFILE_ID,
      upload_batch_id: input.uploadBatchId,
      source_image_id: input.sourceImageId,
      job_kind: input.jobKind ?? "single_item",
      parent_job_id: input.parentJobId ?? null,
      garment_candidate_id: input.garmentCandidateId ?? null,
      status: "queued",
      error_message: null,
      detected_garment_id: null,
    });

    return this.mapJob(row);
  }

  async getPrettifyJob(jobId: string): Promise<PrettifyJobRecord | null> {
    const { data, error } = await this.supabase.from("prettify_jobs").select("*").eq("id", jobId).maybeSingle();
    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapJob(data as PrettifyJobRow) : null;
  }

  async getPrettifyJobByDetectedGarmentId(garmentId: string): Promise<PrettifyJobRecord | null> {
    const { data, error } = await this.supabase
      .from("prettify_jobs")
      .select("*")
      .eq("detected_garment_id", garmentId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapJob(data as PrettifyJobRow) : null;
  }

  async updatePrettifyJob(jobId: string, patch: Partial<PrettifyJobRecord>): Promise<PrettifyJobRecord> {
    const rowPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) {
      rowPatch.status = patch.status;
    }
    if (patch.jobKind !== undefined) {
      rowPatch.job_kind = patch.jobKind;
    }
    if (patch.parentJobId !== undefined) {
      rowPatch.parent_job_id = patch.parentJobId;
    }
    if (patch.garmentCandidateId !== undefined) {
      rowPatch.garment_candidate_id = patch.garmentCandidateId;
    }
    if (patch.errorMessage !== undefined) {
      rowPatch.error_message = patch.errorMessage;
    }
    if (patch.detectedGarmentId !== undefined) {
      rowPatch.detected_garment_id = patch.detectedGarmentId;
    }

    const { data, error } = await this.supabase
      .from("prettify_jobs")
      .update(rowPatch)
      .eq("id", jobId)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }

    return this.mapJob(data as PrettifyJobRow);
  }

  async getUploadBatch(batchId: string): Promise<UploadBatch | null> {
    const { data, error } = await this.supabase
      .from("upload_batches")
      .select("*")
      .eq("id", batchId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }

    return data ? mapSupabaseUploadBatch(data as SupabaseUploadBatchRow, []) : null;
  }

  async getSourceImage(sourceImageId: string): Promise<RealSourceImageRecord | null> {
    const { data, error } = await this.supabase.from("source_images").select("*").eq("id", sourceImageId).maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    const row = data as SourceImageRow;
    return {
      id: row.id,
      uploadBatchId: row.upload_batch_id,
      bucket: row.bucket,
      storagePath: row.storage_path,
      signedUrl: await this.createSignedUrl(row.bucket, row.storage_path),
      contentType: row.content_type,
      originalFilename: row.original_filename,
    };
  }

  async createGarmentCandidate(
    input: Omit<GarmentCandidateRecord, "id" | "errorMessage" | "detectedGarmentId">,
  ): Promise<GarmentCandidateRecord> {
    const values = {
      household_id: REAL_HOUSEHOLD_ID,
      upload_batch_id: input.uploadBatchId,
      source_image_id: input.sourceImageId,
      parent_job_id: input.parentJobId,
      proposed_name: input.proposedName,
      category: input.category,
      confidence: input.confidence,
      visibility_state: input.visibilityState,
      bounding_box: input.boundingBox,
      crop_prompt: input.cropPrompt,
      should_prettify: input.shouldPrettify,
      selection_status: input.selectionStatus,
      selection_reason: input.selectionReason,
      duplicate_hint: input.duplicateHint,
      status: input.status,
      error_message: null,
      detected_garment_id: null,
    };

    const row = await this.insertSingleWithSchemaFallback<GarmentCandidateRow>("garment_candidates", values, [
      "selection_status",
      "selection_reason",
      "duplicate_hint",
    ]);

    return this.mapCandidate(row);
  }

  async getGarmentCandidate(candidateId: string): Promise<GarmentCandidateRecord | null> {
    const { data, error } = await this.supabase
      .from("garment_candidates")
      .select("*")
      .eq("id", candidateId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapCandidate(data as GarmentCandidateRow) : null;
  }

  async listGarmentCandidatesForBatch(batchId: string): Promise<GarmentCandidateRecord[]> {
    const { data, error } = await this.supabase
      .from("garment_candidates")
      .select("*")
      .eq("upload_batch_id", batchId)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as GarmentCandidateRow[]).map((row) => this.mapCandidate(row));
  }

  async updateGarmentCandidate(
    candidateId: string,
    patch: Partial<GarmentCandidateRecord>,
  ): Promise<GarmentCandidateRecord> {
    const rowPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) {
      rowPatch.status = patch.status;
    }
    if (patch.errorMessage !== undefined) {
      rowPatch.error_message = patch.errorMessage;
    }
    if (patch.detectedGarmentId !== undefined) {
      rowPatch.detected_garment_id = patch.detectedGarmentId;
    }
    if (patch.selectionStatus !== undefined) {
      rowPatch.selection_status = patch.selectionStatus;
    }
    if (patch.selectionReason !== undefined) {
      rowPatch.selection_reason = patch.selectionReason;
    }
    if (patch.duplicateHint !== undefined) {
      rowPatch.duplicate_hint = patch.duplicateHint;
    }

    let { data, error } = await this.supabase
      .from("garment_candidates")
      .update(rowPatch)
      .eq("id", candidateId)
      .select()
      .single();
    if (error && isMissingSchemaColumnError(error.message)) {
      const fallbackPatch = withoutKeys(rowPatch, ["selection_status", "selection_reason", "duplicate_hint"]);
      const fallbackResult = await this.supabase
        .from("garment_candidates")
        .update(fallbackPatch)
        .eq("id", candidateId)
        .select()
        .single();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }
    if (error) {
      throw new Error(error.message);
    }

    return this.mapCandidate(data as GarmentCandidateRow);
  }

  async createDetectedGarment(input: {
    uploadBatchId: string;
    proposedName: string;
    category: DetectedGarment["category"];
    confidence: DetectedGarment["confidence"];
    prettifyStatus: DetectedGarment["prettifyStatus"];
    readyForMixer: boolean;
    asset: ClosetAsset;
    sourceType?: Extract<UploadSourceType, "item_photo" | "outfit_photo">;
    sourceImageId?: string;
    garmentCandidateId?: string;
    visibilityState?: GarmentVisibilityState;
    sourceBoundingBox?: GarmentBoundingBox;
  }): Promise<DetectedGarment> {
    if (!("imageUrl" in input.asset)) {
      throw new Error("Real detected garments require an image asset.");
    }

    const values: Record<string, unknown> = {
      household_id: REAL_HOUSEHOLD_ID,
      upload_batch_id: input.uploadBatchId,
      proposed_name: input.proposedName,
      brand: "",
      category: input.category,
      owner_profile_id: REAL_PROFILE_ID,
      source_type: input.sourceType ?? "item_photo",
      confidence: input.confidence,
      prettify_status: input.prettifyStatus,
      is_layered: false,
      ready_for_mixer: input.readyForMixer,
      asset_id: input.asset.id,
      asset_label: input.asset.label,
      asset_bucket: input.asset.bucket,
      asset_storage_path: input.asset.storagePath,
    };

    if (input.sourceImageId) {
      values.source_image_id = input.sourceImageId;
    }
    if (input.garmentCandidateId) {
      values.garment_candidate_id = input.garmentCandidateId;
    }
    if (input.visibilityState) {
      values.visibility_state = input.visibilityState;
    }
    if (input.sourceBoundingBox) {
      values.source_bounding_box = input.sourceBoundingBox;
    }

    const row = await this.insertSingle<SupabaseDetectedGarmentRow>("detected_garments", values);

    return mapSupabaseDetectedGarment(row, input.asset.imageUrl);
  }

  async listDetectedGarmentsForBatch(batchId: string): Promise<DetectedGarment[]> {
    const { data, error } = await this.supabase
      .from("detected_garments")
      .select("*")
      .eq("upload_batch_id", batchId)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(error.message);
    }

    return Promise.all(
      ((data ?? []) as SupabaseDetectedGarmentRow[]).map(async (row) =>
        mapSupabaseDetectedGarment(row, await this.createSignedUrl(row.asset_bucket, row.asset_storage_path)),
      ),
    );
  }

  async getDetectedGarment(garmentId: string): Promise<DetectedGarment | null> {
    const { data, error } = await this.supabase
      .from("detected_garments")
      .select("*")
      .eq("id", garmentId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    const row = data as SupabaseDetectedGarmentRow;
    return mapSupabaseDetectedGarment(row, await this.createSignedUrl(row.asset_bucket, row.asset_storage_path));
  }

  async deleteDetectedGarment(garmentId: string): Promise<void> {
    const { error } = await this.supabase.from("detected_garments").delete().eq("id", garmentId);
    if (error) {
      throw new Error(error.message);
    }
  }

  async createWardrobeItem(input: { garment: DetectedGarment; addedAtIso: string }): Promise<WardrobeItem> {
    if (!("imageUrl" in input.garment.asset)) {
      throw new Error("Real wardrobe items require an image asset.");
    }

    const row = await this.insertSingle<SupabaseWardrobeItemRow>("wardrobe_items", {
      household_id: REAL_HOUSEHOLD_ID,
      source_detected_garment_id: input.garment.id,
      name: input.garment.proposedName,
      brand: input.garment.brand,
      category: input.garment.category,
      owner_profile_id: input.garment.ownerProfileId,
      asset_id: input.garment.asset.id,
      asset_label: input.garment.asset.label,
      asset_bucket: input.garment.asset.bucket,
      asset_storage_path: input.garment.asset.storagePath,
      added_at: input.addedAtIso,
      ready_for_mixer: input.garment.readyForMixer,
    });

    return mapSupabaseWardrobeItem(row, input.garment.asset.imageUrl);
  }

  async deleteWardrobeItem(wardrobeItemId: string): Promise<void> {
    const { error } = await this.supabase
      .from("wardrobe_items")
      .delete()
      .eq("household_id", REAL_HOUSEHOLD_ID)
      .eq("id", wardrobeItemId);
    if (error) {
      throw new Error(error.message);
    }
  }

  async getUploadBatchWithGarments(batchId: string): Promise<UploadBatch | null> {
    const { data: batch, error: batchError } = await this.supabase
      .from("upload_batches")
      .select("*")
      .eq("id", batchId)
      .maybeSingle();
    if (batchError) {
      throw new Error(batchError.message);
    }
    if (!batch) {
      return null;
    }

    const { data: garmentRows, error: garmentError } = await this.supabase
      .from("detected_garments")
      .select("*")
      .eq("upload_batch_id", batchId)
      .order("created_at", { ascending: true });
    if (garmentError) {
      throw new Error(garmentError.message);
    }

    const garments = await Promise.all(
      ((garmentRows ?? []) as SupabaseDetectedGarmentRow[]).map(async (row) =>
        mapSupabaseDetectedGarment(row, await this.createSignedUrl(row.asset_bucket, row.asset_storage_path)),
      ),
    );

    const { data: candidateRows, error: candidateError } = await this.supabase
      .from("garment_candidates")
      .select("*")
      .eq("upload_batch_id", batchId);
    if (candidateError) {
      return mapSupabaseUploadBatch(batch as SupabaseUploadBatchRow, garments);
    }

    const candidates = ((candidateRows ?? []) as GarmentCandidateRow[]).map((row) => this.mapCandidate(row));
    const sourceImage = await this.getBatchSourceImageReference(batchId);
    return mapSupabaseUploadBatch(
      {
        ...(batch as SupabaseUploadBatchRow),
        candidate_summary: summarizeOutfitCandidates(candidates),
        garment_candidates: candidates.map((candidate) => ({
          id: candidate.id,
          uploadBatchId: candidate.uploadBatchId,
          proposedName: candidate.proposedName,
          category: candidate.category,
          confidence: candidate.confidence,
          visibilityState: candidate.visibilityState,
          boundingBox: candidate.boundingBox,
          selectionStatus: candidate.selectionStatus,
          selectionReason: candidate.selectionReason,
          duplicateHint: candidate.duplicateHint,
          status: candidate.status,
          detectedGarmentId: candidate.detectedGarmentId,
        })),
        source_image: sourceImage ?? undefined,
      },
      garments,
    );
  }

  async listWardrobeItems(): Promise<WardrobeItem[]> {
    const { data, error } = await this.supabase
      .from("wardrobe_items")
      .select("*")
      .eq("household_id", REAL_HOUSEHOLD_ID)
      .order("added_at", { ascending: true });
    if (error) {
      throw new Error(error.message);
    }

    return Promise.all(
      ((data ?? []) as SupabaseWardrobeItemRow[]).map(async (row) =>
        mapSupabaseWardrobeItem(row, await this.createSignedUrl(row.asset_bucket, row.asset_storage_path)),
      ),
    );
  }

  private async insertSingle<T>(table: string, values: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.supabase.from(table).insert(values).select().single();
    if (error) {
      throw new Error(error.message);
    }

    return data as T;
  }

  private async insertSingleWithSchemaFallback<T>(
    table: string,
    values: Record<string, unknown>,
    optionalColumns: string[],
  ): Promise<T> {
    try {
      return await this.insertSingle<T>(table, values);
    } catch (error) {
      if (!(error instanceof Error) || !isMissingSchemaColumnError(error.message)) {
        throw error;
      }

      return this.insertSingle<T>(table, withoutKeys(values, optionalColumns));
    }
  }

  private async createSignedUrl(bucket: string, storagePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 60);
    if (error) {
      throw new Error(error.message);
    }

    return data.signedUrl;
  }

  private async getBatchSourceImageReference(batchId: string) {
    const { data, error } = await this.supabase
      .from("source_images")
      .select("*")
      .eq("upload_batch_id", batchId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return null;
    }

    const row = data as SourceImageRow;
    return {
      id: row.id,
      imageUrl: await this.createSignedUrl(row.bucket, row.storage_path),
      contentType: row.content_type,
      originalFilename: row.original_filename,
    };
  }

  private mapJob(row: PrettifyJobRow): PrettifyJobRecord {
    return {
      id: row.id,
      uploadBatchId: row.upload_batch_id,
      sourceImageId: row.source_image_id,
      jobKind: row.job_kind ?? "single_item",
      parentJobId: row.parent_job_id ?? null,
      garmentCandidateId: row.garment_candidate_id ?? null,
      status: row.status,
      errorMessage: row.error_message,
      detectedGarmentId: row.detected_garment_id,
    };
  }

  private mapCandidate(row: GarmentCandidateRow): GarmentCandidateRecord {
    return {
      id: row.id,
      uploadBatchId: row.upload_batch_id,
      sourceImageId: row.source_image_id,
      parentJobId: row.parent_job_id,
      proposedName: row.proposed_name,
      category: row.category,
      confidence: row.confidence,
      visibilityState: row.visibility_state,
      boundingBox: row.bounding_box,
      cropPrompt: row.crop_prompt,
      shouldPrettify: row.should_prettify,
      selectionStatus: row.selection_status ?? getFallbackSelectionStatus(row),
      selectionReason: row.selection_reason ?? getFallbackSelectionReason(row),
      duplicateHint: row.duplicate_hint ?? false,
      status: row.status,
      errorMessage: row.error_message,
      detectedGarmentId: row.detected_garment_id,
    };
  }
}

function withoutKeys(values: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const stripped = { ...values };
  for (const key of keys) {
    delete stripped[key];
  }

  return stripped;
}

function isMissingSchemaColumnError(message: string): boolean {
  return message.includes("Could not find the") && message.includes("column") && message.includes("schema cache");
}

function getFallbackSelectionStatus(row: GarmentCandidateRow): CandidateSelectionStatus {
  if (row.confidence === "low" || row.visibility_state === "occluded") {
    return "not_recommended";
  }
  if (row.category === "tops" || row.category === "outerwear" || row.category === "bottoms") {
    return "primary";
  }

  return "optional";
}

function getFallbackSelectionReason(row: GarmentCandidateRow): string {
  if (row.confidence === "low" || row.visibility_state === "occluded") {
    return row.visibility_state === "occluded" ? "Not enough of this item is visible" : "Needs a clearer photo";
  }
  if (row.category === "footwear") {
    return "Shoes are optional for this upload";
  }
  if (row.category === "accessories") {
    return "Accessory saved as optional";
  }

  return "Clear clothing item";
}
