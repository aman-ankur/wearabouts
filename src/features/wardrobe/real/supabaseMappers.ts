import type {
  ClosetAssetBucket,
  ConfidenceLevel,
  DetectedGarment,
  GarmentBoundingBox,
  GarmentCategory,
  GarmentVisibilityState,
  PrettifyStatus,
  UploadBatch,
  UploadBatchCandidateSummary,
  UploadSourceType,
  WardrobeItem,
  WardrobeProfileId,
} from "@/src/domain/wardrobe";

export interface SupabaseUploadBatchRow {
  id: string;
  source_type: UploadSourceType;
  title: string;
  created_at: string;
  candidate_summary?: UploadBatchCandidateSummary;
}

export interface SupabaseDetectedGarmentRow {
  id: string;
  upload_batch_id: string;
  proposed_name: string;
  brand: string;
  category: GarmentCategory;
  owner_profile_id: WardrobeProfileId;
  source_type: UploadSourceType;
  confidence: ConfidenceLevel;
  prettify_status: PrettifyStatus;
  is_layered: boolean;
  ready_for_mixer: boolean;
  asset_id: string;
  asset_label: string;
  asset_bucket: ClosetAssetBucket;
  asset_storage_path: string;
  source_image_id?: string | null;
  garment_candidate_id?: string | null;
  visibility_state?: GarmentVisibilityState | null;
  source_bounding_box?: GarmentBoundingBox | null;
}

export interface SupabaseWardrobeItemRow {
  id: string;
  source_detected_garment_id: string;
  name: string;
  brand: string;
  category: GarmentCategory;
  owner_profile_id: WardrobeProfileId;
  asset_id: string;
  asset_label: string;
  asset_bucket: ClosetAssetBucket;
  asset_storage_path: string;
  added_at: string;
  ready_for_mixer: boolean;
}

export function mapSupabaseUploadBatch(
  row: SupabaseUploadBatchRow,
  detectedGarments: DetectedGarment[],
): UploadBatch {
  return {
    id: row.id,
    sourceType: row.source_type,
    title: row.title,
    createdAtIso: row.created_at,
    detectedGarments,
    candidateSummary: row.candidate_summary,
  };
}

export function mapSupabaseDetectedGarment(row: SupabaseDetectedGarmentRow, imageUrl: string): DetectedGarment {
  return {
    id: row.id,
    uploadBatchId: row.upload_batch_id,
    proposedName: row.proposed_name,
    brand: row.brand,
    category: row.category,
    ownerProfileId: row.owner_profile_id,
    sourceType: row.source_type,
    confidence: row.confidence,
    prettifyStatus: row.prettify_status,
    isLayered: row.is_layered,
    readyForMixer: row.ready_for_mixer,
    sourceImageId: row.source_image_id ?? undefined,
    garmentCandidateId: row.garment_candidate_id ?? undefined,
    visibilityState: row.visibility_state ?? undefined,
    sourceBoundingBox: row.source_bounding_box ?? undefined,
    asset: {
      id: row.asset_id,
      kind: "prettified",
      label: row.asset_label,
      bucket: row.asset_bucket,
      storagePath: row.asset_storage_path,
      imageUrl,
    },
  };
}

export function mapSupabaseWardrobeItem(row: SupabaseWardrobeItemRow, imageUrl: string): WardrobeItem {
  return {
    id: row.id,
    sourceDetectedGarmentId: row.source_detected_garment_id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    ownerProfileId: row.owner_profile_id,
    asset: {
      id: row.asset_id,
      kind: "prettified",
      label: row.asset_label,
      bucket: row.asset_bucket,
      storagePath: row.asset_storage_path,
      imageUrl,
    },
    addedAtIso: row.added_at,
    readyForMixer: row.ready_for_mixer,
  };
}
