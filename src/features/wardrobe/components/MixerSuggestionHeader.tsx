import React from "react";
import { getOutfitIntentLabel } from "@/src/features/wardrobe/outfits/outfitIntentDisplay";
import type { OutfitSuggestion } from "@/src/features/wardrobe/outfits/outfitTypes";

interface MixerSuggestionHeaderProps {
  suggestion: OutfitSuggestion;
}

export function MixerSuggestionHeader({ suggestion }: MixerSuggestionHeaderProps) {
  return (
    <div>
      <p className="subtle" style={{ margin: 0 }}>
        You · {getOutfitIntentLabel(suggestion.intent)}
      </p>
      <h2 style={{ fontSize: 22, lineHeight: 1.05, margin: "4px 0 0" }}>{suggestion.title}</h2>
    </div>
  );
}
