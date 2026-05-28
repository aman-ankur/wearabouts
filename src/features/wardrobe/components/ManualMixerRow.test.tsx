import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { findClosestCenteredItemId, ManualMixerRow } from "./ManualMixerRow";

function item(id: string, name: string, category: WardrobeItem["category"]): WardrobeItem {
  return {
    id,
    sourceDetectedGarmentId: `detected-${id}`,
    ownerProfileId: "profile-aankur",
    name,
    brand: "",
    category,
    readyForMixer: true,
    addedAtIso: "2026-05-28T10:00:00.000Z",
    asset: { id: `asset-${id}`, kind: "prettified", label: name, visualToken: "shirt-striped" },
  };
}

describe("ManualMixerRow", () => {
  it("marks the selected piece without rendering a visible center guide", () => {
    const html = renderToStaticMarkup(
      <ManualMixerRow
        label="Bottoms"
        emptyLabel="No bottoms yet"
        items={[
          item("trousers", "Dark Brown Trousers", "bottoms"),
          item("cargo", "Light Sage Cargo Pants", "bottoms"),
        ]}
        selectedItemId="cargo"
        onSelect={() => {}}
      />,
    );

    expect(html).not.toContain("data-manual-mixer-center-guide");
    expect(html).toContain("Swipe");
    expect(html).not.toContain("Swipe horizontally");
    expect(html).toContain('data-manual-mixer-selected="true"');
    expect(html).toContain('aria-pressed="true"');
  });

  it("finds the piece closest to the row center", () => {
    expect(
      findClosestCenteredItemId(100, 300, [
        { id: "left", left: 110, width: 100 },
        { id: "middle", left: 235, width: 100 },
        { id: "right", left: 360, width: 100 },
      ]),
    ).toBe("middle");
  });
});
