import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClosetAsset } from "@/src/domain/wardrobe";
import type { RealAssetStorage, RealSourceImageRecord, RealUploadFile } from "./realWardrobePipeline";
import type { RealWardrobeOwner } from "./realWardrobeConfig";

function sanitizeFilename(filename: string): string {
  return filename.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

export class SupabaseRealAssetStorage implements RealAssetStorage {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly owner: RealWardrobeOwner,
  ) {}

  async uploadSourceImage(input: { file: RealUploadFile; uploadBatchId: string }) {
    const storagePath = `${this.owner.circleId}/${this.owner.profileId}/source-${randomUUID()}.${extensionForFilename(
      input.file.name,
      input.file.type,
    )}`;
    const bytes = Buffer.from(await input.file.arrayBuffer());
    const contentHash = createHash("sha256").update(bytes).digest("hex");
    const { error } = await this.supabase.storage.from("source-images").upload(storagePath, bytes, {
      contentType: input.file.type,
      upsert: false,
    });
    if (error) {
      throw new Error(error.message);
    }

    return {
      bucket: "source-images" as const,
      storagePath,
      signedUrl: await this.createSignedUrl("source-images", storagePath),
      contentHash,
    };
  }

  async downloadSourceImage(sourceImage: RealSourceImageRecord) {
    const { data, error } = await this.supabase.storage.from(sourceImage.bucket).download(sourceImage.storagePath);
    if (error) {
      throw new Error(error.message);
    }

    return {
      bytes: new Uint8Array(await data.arrayBuffer()),
      contentType: sourceImage.contentType,
    };
  }

  async uploadClosetAsset(input: { bytes: Uint8Array; contentType: "image/png"; label: string }): Promise<ClosetAsset> {
    const assetId = `asset-${randomUUID()}`;
    const storagePath = `${this.owner.circleId}/${this.owner.profileId}/${assetId}.png`;
    const { error } = await this.supabase.storage.from("closet-assets").upload(storagePath, Buffer.from(input.bytes), {
      contentType: input.contentType,
      upsert: false,
    });
    if (error) {
      throw new Error(error.message);
    }

    return {
      id: assetId,
      kind: "prettified",
      label: input.label,
      bucket: "closet-assets",
      storagePath,
      imageUrl: await this.createSignedUrl("closet-assets", storagePath),
    };
  }

  private async createSignedUrl(bucket: string, storagePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 60);
    if (error) {
      throw new Error(error.message);
    }

    return data.signedUrl;
  }
}

function extensionForFilename(filename: string, contentType: string): string {
  const sanitized = sanitizeFilename(filename);
  const extension = sanitized.split(".").pop();
  if (extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "webp") {
    return extension === "jpeg" ? "jpg" : extension;
  }
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}
