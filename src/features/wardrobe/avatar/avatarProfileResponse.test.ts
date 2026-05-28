import { describe, expect, it } from "vitest";
import type { AvatarProfile } from "./avatarTypes";
import { toAvatarProfileResponse } from "./avatarProfileResponse";

const profile: AvatarProfile = {
  id: "avatar-profile-aankur",
  profileId: "profile-aankur",
  faceAssetId: "avatar-face-1",
  bodyAssetId: "avatar-body-1",
  faceImageUrl: `data:image/png;base64,${"a".repeat(5_000_000)}`,
  bodyImageUrl: `data:image/png;base64,${"b".repeat(5_000_000)}`,
  faceQuality: { status: "passed", reasons: [] },
  bodyQuality: { status: "passed", reasons: [] },
  createdAtIso: "2026-05-28T00:00:00.000Z",
  updatedAtIso: "2026-05-28T00:00:00.000Z",
};

describe("toAvatarProfileResponse", () => {
  it("keeps avatar profile responses metadata-only", () => {
    const response = toAvatarProfileResponse(profile);

    expect(response).not.toHaveProperty("faceImageUrl");
    expect(response).not.toHaveProperty("bodyImageUrl");
    expect(JSON.stringify(response).length).toBeLessThan(1_000);
  });

  it("preserves a missing avatar profile", () => {
    expect(toAvatarProfileResponse(null)).toBeNull();
  });
});
