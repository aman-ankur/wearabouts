import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { MixerBodyStage } from "./MixerBodyStage";

function realItem(overrides: Partial<Omit<WardrobeItem, "sourceDetectedGarmentId">>): WardrobeItem {
  return {
    id: overrides.id ?? "item-real-1",
    sourceDetectedGarmentId: `detected-${overrides.id ?? "real-1"}`,
    ownerProfileId: "profile-aankur",
    name: overrides.name ?? "White t-shirt",
    brand: "Wearabouts",
    category: overrides.category ?? "tops",
    colors: ["white"],
    warmth: "light",
    formality: "casual",
    styleTags: ["casual"],
    readyForMixer: true,
    addedAtIso: "2026-05-27T00:00:00.000Z",
    asset: {
      id: `asset-${overrides.id ?? "real-1"}`,
      kind: "prettified",
      label: overrides.name ?? "White t-shirt asset",
      bucket: "closet-assets",
      storagePath: `demo-household/profile-aankur/${overrides.id ?? "real-1"}.png`,
      imageUrl: `https://signed.example/${overrides.id ?? "real-1"}.png`,
    },
    ...overrides,
  };
}

describe("MixerBodyStage", () => {
  it("lays real image assets onto a single clean canvas without empty slot placeholders", () => {
    const html = renderToStaticMarkup(
      <MixerBodyStage
        selectedItems={{
          top: realItem({ id: "top", name: "White t-shirt", category: "tops" }),
          bottom: realItem({ id: "bottom", name: "Dark trousers", category: "bottoms" }),
        }}
      />,
    );

    expect(html).toContain('data-mixer-board-canvas="clean"');
    expect(html).toContain('data-mixer-board-item-frame="top"');
    expect(html).toContain('data-mixer-board-item-frame="bottom"');
    expect(html).not.toContain('data-mixer-board-item-frame="accessory"');
    expect(html).toContain("position:absolute");
    expect(html).toContain("overflow:hidden");
    expect(html).toContain('src="https://signed.example/top.png"');
    expect(html).toContain('src="https://signed.example/bottom.png"');
  });
});
