import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseRealWardrobeRepository } from "./supabaseRealWardrobeRepository";

describe("SupabaseRealWardrobeRepository", () => {
  it("creates detected garments without Phase 5 metadata when the live schema is behind", async () => {
    const inserts: Record<string, unknown>[] = [];
    const supabase = {
      from(table: string) {
        expect(table).toBe("detected_garments");
        return {
          insert(values: Record<string, unknown>) {
            inserts.push(values);
            return {
              select() {
                return {
                  async single() {
                    if ("source_bounding_box" in values) {
                      return {
                        data: null,
                        error: { message: "Could not find the 'source_bounding_box' column of 'detected_garments' in the schema cache" },
                      };
                    }

                    return {
                      data: {
                        id: "garment-1",
                        upload_batch_id: values.upload_batch_id,
                        proposed_name: values.proposed_name,
                        brand: values.brand,
                        category: values.category,
                        owner_profile_id: values.owner_profile_id,
                        source_type: values.source_type,
                        confidence: values.confidence,
                        prettify_status: values.prettify_status,
                        is_layered: values.is_layered,
                        ready_for_mixer: values.ready_for_mixer,
                        asset_id: values.asset_id,
                        asset_label: values.asset_label,
                        asset_bucket: values.asset_bucket,
                        asset_storage_path: values.asset_storage_path,
                      },
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient;
    const repository = new SupabaseRealWardrobeRepository(supabase, {
      circleId: "circle-1",
      profileId: "profile-1",
    });

    const garment = await repository.createDetectedGarment({
      uploadBatchId: "batch-1",
      proposedName: "Red Plaid Skirt",
      category: "bottoms",
      confidence: "high",
      prettifyStatus: "ready",
      readyForMixer: true,
      sourceType: "outfit_photo",
      sourceImageId: "source-1",
      garmentCandidateId: "candidate-1",
      visibilityState: "visible",
      sourceBoundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
      asset: {
        id: "asset-1",
        kind: "prettified",
        label: "skirt asset",
        bucket: "closet-assets",
        storagePath: "circle-1/profile-1/asset-1.png",
        imageUrl: "https://signed.example/asset-1.png",
      },
    });

    expect(inserts).toHaveLength(2);
    expect(inserts[0]).toMatchObject({
      source_image_id: "source-1",
      garment_candidate_id: "candidate-1",
      visibility_state: "visible",
      source_bounding_box: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
    });
    expect(inserts[0]).not.toHaveProperty("profile_id");
    expect(inserts[1]).not.toHaveProperty("source_image_id");
    expect(inserts[1]).not.toHaveProperty("garment_candidate_id");
    expect(inserts[1]).not.toHaveProperty("visibility_state");
    expect(inserts[1]).not.toHaveProperty("source_bounding_box");
    expect(inserts[1]).not.toHaveProperty("profile_id");
    expect(garment.id).toBe("garment-1");
    expect(garment.sourceImageId).toBeUndefined();
  });
});
