import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClosetAsset,
  DetectedGarment,
  UploadBatch,
  WardrobeItem,
} from "@/src/domain/wardrobe";
import type { PrettifyJobRecord, RealSourceImageRecord, RealWardrobeRepository } from "./realWardrobePipeline";
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
  status: PrettifyJobRecord["status"];
  error_message: string | null;
  detected_garment_id: string | null;
}

export class SupabaseRealWardrobeRepository implements RealWardrobeRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createUploadBatch(input: { sourceType: "item_photo"; title: string }): Promise<UploadBatch> {
    const row = await this.insertSingle<SupabaseUploadBatchRow>("upload_batches", {
      household_id: REAL_HOUSEHOLD_ID,
      profile_id: REAL_PROFILE_ID,
      source_type: input.sourceType,
      title: input.title,
    });

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

  async createPrettifyJob(input: { uploadBatchId: string; sourceImageId: string }): Promise<PrettifyJobRecord> {
    const row = await this.insertSingle<PrettifyJobRow>("prettify_jobs", {
      household_id: REAL_HOUSEHOLD_ID,
      profile_id: REAL_PROFILE_ID,
      upload_batch_id: input.uploadBatchId,
      source_image_id: input.sourceImageId,
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

  async createDetectedGarment(input: {
    uploadBatchId: string;
    proposedName: string;
    category: DetectedGarment["category"];
    confidence: DetectedGarment["confidence"];
    prettifyStatus: DetectedGarment["prettifyStatus"];
    readyForMixer: boolean;
    asset: ClosetAsset;
  }): Promise<DetectedGarment> {
    if (!("imageUrl" in input.asset)) {
      throw new Error("Real detected garments require an image asset.");
    }

    const row = await this.insertSingle<SupabaseDetectedGarmentRow>("detected_garments", {
      household_id: REAL_HOUSEHOLD_ID,
      upload_batch_id: input.uploadBatchId,
      proposed_name: input.proposedName,
      brand: "",
      category: input.category,
      owner_profile_id: REAL_PROFILE_ID,
      source_type: "item_photo",
      confidence: input.confidence,
      prettify_status: input.prettifyStatus,
      is_layered: false,
      ready_for_mixer: input.readyForMixer,
      asset_id: input.asset.id,
      asset_label: input.asset.label,
      asset_bucket: input.asset.bucket,
      asset_storage_path: input.asset.storagePath,
    });

    return mapSupabaseDetectedGarment(row, input.asset.imageUrl);
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

    return mapSupabaseUploadBatch(batch as SupabaseUploadBatchRow, garments);
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

  private async createSignedUrl(bucket: string, storagePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 60);
    if (error) {
      throw new Error(error.message);
    }

    return data.signedUrl;
  }

  private mapJob(row: PrettifyJobRow): PrettifyJobRecord {
    return {
      id: row.id,
      uploadBatchId: row.upload_batch_id,
      sourceImageId: row.source_image_id,
      status: row.status,
      errorMessage: row.error_message,
      detectedGarmentId: row.detected_garment_id,
    };
  }
}
