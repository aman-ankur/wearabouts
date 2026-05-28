import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AvatarRender } from "@/src/features/wardrobe/avatar/avatarTypes";
import { AvatarRenderPreviewDialog } from "./AvatarRenderGallery";

const render: AvatarRender = {
  id: "render-1",
  request: {
    avatarProfileId: "avatar-profile-aankur",
    savedOutfitId: "outfit-1",
    wardrobeItemIds: ["shirt", "trousers"],
    poseId: "studio-three-quarter",
    quality: "final",
    promptVersion: "avatar-studio-v1",
  },
  cacheKey: "avatar:cache-key",
  status: "ready",
  imageUrl: "data:image/svg+xml,ready",
  qualityNotes: [],
  createdAtIso: "2026-05-28T10:00:00.000Z",
};

describe("AvatarRenderPreviewDialog", () => {
  it("renders a scrollable mobile-style preview sheet", () => {
    const html = renderToStaticMarkup(<AvatarRenderPreviewDialog render={render} onClose={() => {}} onDelete={() => {}} />);

    expect(html).toContain("avatar-preview-overlay");
    expect(html).toContain("avatar-preview-sheet");
    expect(html).toContain("Full-size avatar render");
    expect(html).toContain("Delete render");
  });
});
