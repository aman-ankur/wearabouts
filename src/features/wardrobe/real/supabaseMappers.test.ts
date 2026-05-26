import { describe, expect, it } from "vitest";
import type { SupabaseDetectedGarmentRow, SupabaseUploadBatchRow, SupabaseWardrobeItemRow } from "./supabaseMappers";
import { mapSupabaseDetectedGarment, mapSupabaseUploadBatch, mapSupabaseWardrobeItem } from "./supabaseMappers";

describe("supabaseMappers", () => {
  it("maps an upload batch row to the wardrobe domain", () => {
    const row: SupabaseUploadBatchRow = {
      id: "batch-real-1",
      source_type: "item_photo",
      title: "Real item upload",
      created_at: "2026-05-26T10:00:00.000Z",
    };

    expect(mapSupabaseUploadBatch(row, [])).toEqual({
      id: "batch-real-1",
      sourceType: "item_photo",
      extractionMode: "single_item",
      skipExistingItems: true,
      title: "Real item upload",
      createdAtIso: "2026-05-26T10:00:00.000Z",
      detectedGarments: [],
      candidateSummary: undefined,
      garmentCandidates: undefined,
    });
  });

  it("maps a detected garment row with a signed real asset URL", () => {
    const row: SupabaseDetectedGarmentRow = {
      id: "garment-real-1",
      upload_batch_id: "batch-real-1",
      proposed_name: "Blue Oxford Shirt",
      brand: "",
      category: "tops",
      owner_profile_id: "profile-aankur",
      source_type: "item_photo",
      confidence: "high",
      prettify_status: "ready",
      is_layered: false,
      ready_for_mixer: true,
      asset_id: "asset-real-1",
      asset_label: "Generated studio asset",
      asset_bucket: "closet-assets",
      asset_storage_path: "demo-household/profile-aankur/asset-real-1.png",
    };

    expect(mapSupabaseDetectedGarment(row, "https://signed.example/asset.png")).toEqual({
      id: "garment-real-1",
      uploadBatchId: "batch-real-1",
      proposedName: "Blue Oxford Shirt",
      brand: "",
      category: "tops",
      ownerProfileId: "profile-aankur",
      sourceType: "item_photo",
      confidence: "high",
      prettifyStatus: "ready",
      isLayered: false,
      readyForMixer: true,
      asset: {
        id: "asset-real-1",
        kind: "prettified",
        label: "Generated studio asset",
        bucket: "closet-assets",
        storagePath: "demo-household/profile-aankur/asset-real-1.png",
        imageUrl: "https://signed.example/asset.png",
      },
    });
  });

  it("maps a wardrobe item row with a signed real asset URL", () => {
    const row: SupabaseWardrobeItemRow = {
      id: "wardrobe-real-1",
      source_detected_garment_id: "garment-real-1",
      name: "Blue Oxford Shirt",
      brand: "",
      category: "tops",
      owner_profile_id: "profile-aankur",
      asset_id: "asset-real-1",
      asset_label: "Generated studio asset",
      asset_bucket: "closet-assets",
      asset_storage_path: "demo-household/profile-aankur/asset-real-1.png",
      added_at: "2026-05-26T10:30:00.000Z",
      ready_for_mixer: true,
    };

    expect(mapSupabaseWardrobeItem(row, "https://signed.example/asset.png")).toEqual({
      id: "wardrobe-real-1",
      sourceDetectedGarmentId: "garment-real-1",
      name: "Blue Oxford Shirt",
      brand: "",
      category: "tops",
      ownerProfileId: "profile-aankur",
      asset: {
        id: "asset-real-1",
        kind: "prettified",
        label: "Generated studio asset",
        bucket: "closet-assets",
        storagePath: "demo-household/profile-aankur/asset-real-1.png",
        imageUrl: "https://signed.example/asset.png",
      },
      addedAtIso: "2026-05-26T10:30:00.000Z",
      readyForMixer: true,
    });
  });
});
