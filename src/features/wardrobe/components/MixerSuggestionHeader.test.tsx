import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OutfitSuggestion } from "@/src/features/wardrobe/outfits/outfitTypes";
import { MixerSuggestionHeader } from "./MixerSuggestionHeader";

const suggestion: OutfitSuggestion = {
  id: "suggestion-casual",
  profileId: "profile-aankur",
  intent: "casual",
  title: "Easy white graphic t-shirt",
  score: 126,
  confidenceLabel: ["Strong", "match"].join(" "),
  rationale: "Built for casual from white graphic t-shirt.",
  selections: [],
  warnings: [],
};

describe("MixerSuggestionHeader", () => {
  it("shows purpose and title without match-quality copy", () => {
    const html = renderToStaticMarkup(<MixerSuggestionHeader suggestion={suggestion} />);

    expect(html).toContain("You · Casual");
    expect(html).toContain("Easy white graphic t-shirt");
    expect(html).not.toContain(["Strong", "match"].join(" "));
  });
});
