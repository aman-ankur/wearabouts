import { describe, expect, it } from "vitest";
import { createAvatarUploadSlot, isAvatarStoredInputForSlot, isSupportedAvatarUploadContentType } from "./avatarUploadSlot";

describe("avatarUploadSlot", () => {
  it("accepts only supported avatar image content types", () => {
    expect(isSupportedAvatarUploadContentType("image/jpeg")).toBe(true);
    expect(isSupportedAvatarUploadContentType("image/png")).toBe(true);
    expect(isSupportedAvatarUploadContentType("image/webp")).toBe(true);
    expect(isSupportedAvatarUploadContentType("image/gif")).toBe(false);
  });

  it("creates stable private storage metadata for an avatar input", () => {
    const slot = createAvatarUploadSlot({
      householdId: "demo-household",
      profileId: "profile-aankur",
      kind: "face",
      contentType: "image/jpeg",
      token: "fixed-token",
    });

    expect(slot).toEqual({
      assetId: "avatar-face-fixed-token",
      bucket: "avatar-assets",
      contentType: "image/jpeg",
      storagePath: "demo-household/profile-aankur/avatar-face-fixed-token.jpg",
    });
  });

  it("validates stored input metadata against the expected private path", () => {
    expect(
      isAvatarStoredInputForSlot({
        householdId: "demo-household",
        profileId: "profile-aankur",
        kind: "body",
        storedInput: {
          assetId: "avatar-body-fixed-token",
          contentType: "image/webp",
          storagePath: "demo-household/profile-aankur/avatar-body-fixed-token.webp",
        },
      }),
    ).toBe(true);

    expect(
      isAvatarStoredInputForSlot({
        householdId: "demo-household",
        profileId: "profile-aankur",
        kind: "body",
        storedInput: {
          assetId: "avatar-body-fixed-token",
          contentType: "image/webp",
          storagePath: "other-household/profile-aankur/avatar-body-fixed-token.webp",
        },
      }),
    ).toBe(false);
  });
});
