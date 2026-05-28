import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { MixerBodyStage } from "./MixerBodyStage";

const item: WardrobeItem = {
  id: "top",
  sourceDetectedGarmentId: "detected-top",
  name: "White Graphic T-Shirt",
  brand: "",
  category: "tops",
  ownerProfileId: "profile-aankur",
  asset: { id: "asset-top", kind: "prettified", label: "White Graphic T-Shirt", visualToken: "shirt-striped" },
  addedAtIso: "2026-05-28T08:00:00.000Z",
  readyForMixer: true,
};

describe("MixerBodyStage labels", () => {
  it("can hide board labels when the parent renders full piece details elsewhere", () => {
    const html = renderToStaticMarkup(<MixerBodyStage selectedItems={{ top: item }} showLabels={false} />);

    expect(html).not.toContain("Top: White Graphic T-Shirt");
    expect(html).not.toContain('data-mixer-board-labels="subtle"');
  });
});
