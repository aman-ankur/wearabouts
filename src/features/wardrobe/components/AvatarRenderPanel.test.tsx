import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SavedOutfit, WardrobeItem } from "@/src/domain/wardrobe";
import type { AvatarProfile, AvatarRender } from "@/src/features/wardrobe/avatar/avatarTypes";
import { AvatarRenderPanel } from "./AvatarRenderPanel";

const item = (id: string, name: string, category: WardrobeItem["category"]): WardrobeItem => ({
  id,
  sourceDetectedGarmentId: `detected-${id}`,
  name,
  brand: "",
  category,
  ownerProfileId: "profile-aankur",
  asset: { id: `asset-${id}`, kind: "prettified", label: name, visualToken: "shirt-striped" },
  addedAtIso: "2026-05-28T10:00:00.000Z",
  readyForMixer: true,
});

const savedOutfit: SavedOutfit = {
  id: "outfit-1",
  name: "Dinner look",
  profileId: "profile-aankur",
  createdAtIso: "2026-05-28T10:00:00.000Z",
  selections: [
    { slot: "top", wardrobeItemId: "shirt", locked: false },
    { slot: "bottom", wardrobeItemId: "trousers", locked: false },
  ],
};

const avatarProfile: AvatarProfile = {
  id: "avatar-profile-aankur",
  profileId: "profile-aankur",
  faceAssetId: "face",
  bodyAssetId: "body",
  faceQuality: { status: "passed", reasons: [] },
  bodyQuality: { status: "passed", reasons: [] },
  createdAtIso: "2026-05-28T10:00:00.000Z",
  updatedAtIso: "2026-05-28T10:00:00.000Z",
};

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
  qualityNotes: ["Demo provider render. No AI was called."],
  createdAtIso: "2026-05-28T10:00:00.000Z",
};

describe("AvatarRenderPanel", () => {
  const props = {
    savedOutfit,
    closetItems: [item("shirt", "Striped Shirt", "tops"), item("trousers", "Charcoal Trousers", "bottoms")],
    onGenerate: () => {},
    onRegenerate: () => {},
    onDelete: () => {},
  };

  it("shows setup prompt when avatar profile is missing", () => {
    const html = renderToStaticMarkup(<AvatarRenderPanel {...props} avatarProfile={null} render={null} canRegenerate />);
    expect(html).toContain("Set up avatar photos");
  });

  it("shows ready-to-render state with outfit-board fallback and selected items", () => {
    const html = renderToStaticMarkup(<AvatarRenderPanel {...props} avatarProfile={avatarProfile} render={null} canRegenerate />);
    expect(html).toContain("Ready to render");
    expect(html).toContain("Generate preview");
    expect(html).toContain("2 wardrobe items");
  });

  it("shows ready preview and regenerate/delete/fallback controls", () => {
    const html = renderToStaticMarkup(<AvatarRenderPanel {...props} avatarProfile={avatarProfile} render={render} canRegenerate />);
    expect(html).toContain("Preview ready");
    expect(html).toContain("Saved");
    expect(html).toContain("Regenerate");
    expect(html).toContain("Delete");
    expect(html).toContain("View outfit board");
  });

  it("keeps outfit-board fallback during failures", () => {
    const html = renderToStaticMarkup(
      <AvatarRenderPanel
        {...props}
        avatarProfile={avatarProfile}
        render={{ ...render, status: "failed", imageUrl: undefined, qualityNotes: ["Render failed."] }}
        canRegenerate
      />,
    );

    expect(html).toContain("Render failed");
    expect(html).toContain("Outfit board fallback");
  });
});
