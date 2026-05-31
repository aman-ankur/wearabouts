import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvatarInputQualityCheck, AvatarProfile, AvatarRender, AvatarRenderRequest, AvatarStoredInput } from "./avatarTypes";
import { AVATAR_STORAGE_BUCKET, type AvatarUploadSlot } from "./avatarUploadSlot";
import type { RealWardrobeOwner } from "@/src/features/wardrobe/real/realWardrobeConfig";

interface AvatarProfileRow {
  id: string;
  profile_id: AvatarProfile["profileId"];
  face_asset_id: string;
  body_asset_id: string;
  face_storage_path: string;
  body_storage_path: string;
  face_quality: AvatarInputQualityCheck;
  body_quality: AvatarInputQualityCheck;
  created_at: string;
  updated_at: string;
}

interface AvatarRenderRow {
  id: string;
  avatar_profile_id: string;
  saved_outfit_id: string;
  cache_key: string;
  request: AvatarRenderRequest;
  status: AvatarRender["status"];
  image_asset_id?: string | null;
  image_bucket?: string | null;
  image_storage_path?: string | null;
  quality_notes: string[] | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: "image/png" | "image/jpeg" | "image/webp" } {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.*)$/);
  if (!match) {
    throw new Error("Expected a PNG, JPEG, or WebP data URL.");
  }

  return { contentType: match[1] as "image/png" | "image/jpeg" | "image/webp", bytes: new Uint8Array(Buffer.from(match[2], "base64")) };
}

function extensionForContentType(contentType: string): string {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  return "png";
}

export class AvatarPersistence {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly owner: RealWardrobeOwner,
  ) {}

  async upsertProfile(input: {
    profileId: AvatarProfile["profileId"];
    face: AvatarStoredInput;
    body: AvatarStoredInput;
    faceQuality: AvatarInputQualityCheck;
    bodyQuality: AvatarInputQualityCheck;
  }): Promise<AvatarProfile> {
    const profileId = `avatar-profile-${input.profileId}`;

    const { data, error } = await this.supabase
      .from("avatar_profiles")
      .upsert(
        {
          id: profileId,
          household_id: this.owner.circleId,
          profile_id: input.profileId,
          face_asset_id: input.face.assetId,
          body_asset_id: input.body.assetId,
          face_bucket: AVATAR_STORAGE_BUCKET,
          face_storage_path: input.face.storagePath,
          face_content_type: input.face.contentType,
          body_bucket: AVATAR_STORAGE_BUCKET,
          body_storage_path: input.body.storagePath,
          body_content_type: input.body.contentType,
          face_quality: input.faceQuality,
          body_quality: input.bodyQuality,
        },
        { onConflict: "household_id,profile_id" },
      )
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }

    return this.mapProfile(data as AvatarProfileRow);
  }

  async createUploadUrl(input: AvatarUploadSlot): Promise<{ signedUrl: string; token: string }> {
    const { data, error } = await this.supabase.storage.from(input.bucket).createSignedUploadUrl(input.storagePath, { upsert: false });
    if (error) {
      throw new Error(error.message);
    }

    return { signedUrl: data.signedUrl, token: data.token };
  }

  async getProfile(profileId = this.owner.profileId as AvatarProfile["profileId"]): Promise<AvatarProfile | null> {
    const { data, error } = await this.supabase
      .from("avatar_profiles")
      .select("*")
      .eq("household_id", this.owner.circleId)
      .eq("profile_id", profileId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapProfile(data as AvatarProfileRow) : null;
  }

  async getReadyRender(cacheKey: string): Promise<AvatarRender | null> {
    const { data, error } = await this.supabase
      .from("avatar_renders")
      .select("*")
      .eq("household_id", this.owner.circleId)
      .eq("profile_id", this.owner.profileId)
      .eq("cache_key", cacheKey)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapRender(data as AvatarRenderRow) : null;
  }

  async listRenders(): Promise<AvatarRender[]> {
    const { data, error } = await this.supabase
      .from("avatar_renders")
      .select("*")
      .eq("household_id", this.owner.circleId)
      .eq("profile_id", this.owner.profileId)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      throw new Error(error.message);
    }

    return Promise.all(((data ?? []) as AvatarRenderRow[]).map((row) => this.mapRender(row)));
  }

  async saveRender(input: {
    request: AvatarRenderRequest;
    cacheKey: string;
    imageDataUrl: string;
    qualityNotes: string[];
    providerMetadata?: unknown;
  }): Promise<AvatarRender> {
    const image = dataUrlToBytes(input.imageDataUrl);
    const imageAssetId = `avatar-render-${randomUUID()}`;
    const storagePath = `${this.owner.circleId}/${this.owner.profileId}/${imageAssetId}.${extensionForContentType(image.contentType)}`;
    await this.upload(AVATAR_STORAGE_BUCKET, storagePath, image.bytes, image.contentType, false);

    const { data, error } = await this.supabase
      .from("avatar_renders")
      .insert({
        household_id: this.owner.circleId,
        profile_id: this.owner.profileId,
        avatar_profile_id: input.request.avatarProfileId,
        saved_outfit_id: input.request.savedOutfitId,
        cache_key: input.cacheKey,
        request: input.request,
        status: "ready",
        image_asset_id: imageAssetId,
        image_bucket: AVATAR_STORAGE_BUCKET,
        image_storage_path: storagePath,
        image_content_type: image.contentType,
        quality_notes: input.qualityNotes,
        provider_metadata: input.providerMetadata ?? null,
      })
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }

    return this.mapRender(data as AvatarRenderRow);
  }

  async deleteRender(renderId: string): Promise<void> {
    const { data: row, error: lookupError } = await this.supabase
      .from("avatar_renders")
      .select("image_bucket,image_storage_path")
      .eq("household_id", this.owner.circleId)
      .eq("profile_id", this.owner.profileId)
      .eq("id", renderId)
      .maybeSingle();
    if (lookupError) {
      throw new Error(lookupError.message);
    }
    if (!row) {
      throw new Error("Avatar render not found.");
    }

    const renderRow = row as Pick<AvatarRenderRow, "image_bucket" | "image_storage_path">;
    const { error } = await this.supabase
      .from("avatar_renders")
      .delete()
      .eq("household_id", this.owner.circleId)
      .eq("profile_id", this.owner.profileId)
      .eq("id", renderId);
    if (error) {
      throw new Error(error.message);
    }

    if (renderRow.image_storage_path) {
      await this.supabase.storage.from(renderRow.image_bucket ?? AVATAR_STORAGE_BUCKET).remove([renderRow.image_storage_path]);
    }
  }

  private async upload(bucket: string, storagePath: string, bytes: Uint8Array, contentType: string, upsert: boolean) {
    const { error } = await this.supabase.storage.from(bucket).upload(storagePath, Buffer.from(bytes), {
      contentType,
      upsert,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  private async signedUrl(storagePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(AVATAR_STORAGE_BUCKET).createSignedUrl(storagePath, 60 * 60);
    if (error) {
      throw new Error(error.message);
    }

    return data.signedUrl;
  }

  private async mapProfile(row: AvatarProfileRow): Promise<AvatarProfile> {
    return {
      id: row.id,
      profileId: row.profile_id,
      faceAssetId: row.face_asset_id,
      bodyAssetId: row.body_asset_id,
      faceImageUrl: await this.signedUrl(row.face_storage_path),
      bodyImageUrl: await this.signedUrl(row.body_storage_path),
      faceQuality: row.face_quality,
      bodyQuality: row.body_quality,
      createdAtIso: row.created_at,
      updatedAtIso: row.updated_at,
    };
  }

  private async mapRender(row: AvatarRenderRow): Promise<AvatarRender> {
    return {
      id: row.id,
      request: row.request,
      cacheKey: row.cache_key,
      status: row.status,
      imageAssetId: row.image_asset_id ?? undefined,
      imageUrl: row.image_storage_path ? await this.signedUrl(row.image_storage_path) : undefined,
      qualityNotes: row.quality_notes ?? [],
      createdAtIso: row.created_at,
      updatedAtIso: row.updated_at ?? undefined,
      deletedAtIso: row.deleted_at ?? undefined,
    };
  }
}
