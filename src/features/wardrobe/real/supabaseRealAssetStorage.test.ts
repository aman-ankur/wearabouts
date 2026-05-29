import { describe, expect, it } from "vitest";
import { SupabaseRealAssetStorage } from "./supabaseRealAssetStorage";

describe("SupabaseRealAssetStorage", () => {
  it("stores new source images and closet assets under the session Circle and profile", async () => {
    const uploads: Array<{ bucket: string; path: string }> = [];
    const storage = new SupabaseRealAssetStorage(createMockSupabase(uploads), {
      circleId: "circle-1",
      profileId: "profile-1",
    });

    await storage.uploadSourceImage({
      uploadBatchId: "batch-1",
      file: {
        name: "Blue Shirt.JPG",
        type: "image/jpeg",
        size: 3,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      },
    });
    await storage.uploadClosetAsset({
      bytes: new Uint8Array([4, 5, 6]),
      contentType: "image/png",
      label: "Blue shirt studio asset",
    });

    expect(uploads).toHaveLength(2);
    expect(uploads[0]).toMatchObject({ bucket: "source-images" });
    expect(uploads[0].path).toMatch(/^circle-1\/profile-1\/source-[^.]+\.jpg$/);
    expect(uploads[1]).toMatchObject({ bucket: "closet-assets" });
    expect(uploads[1].path).toMatch(/^circle-1\/profile-1\/asset-[^.]+\.png$/);
  });
});

function createMockSupabase(uploads: Array<{ bucket: string; path: string }>) {
  return {
    storage: {
      from(bucket: string) {
        return {
          upload: async (path: string) => {
            uploads.push({ bucket, path });
            return { error: null };
          },
          createSignedUrl: async (path: string) => ({
            data: { signedUrl: `https://signed.test/${bucket}/${path}` },
            error: null,
          }),
        };
      },
    },
  } as never;
}
