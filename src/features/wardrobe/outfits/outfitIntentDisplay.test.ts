import { describe, expect, it } from "vitest";
import { defaultMixerIntent, getOutfitIntentLabel, getStoredOutfitIntent } from "./outfitIntentDisplay";

describe("outfitIntentDisplay", () => {
  it("defaults the mixer to casual instead of a fixed dinner intent", () => {
    expect(defaultMixerIntent).toBe("casual");
    expect(getOutfitIntentLabel(defaultMixerIntent)).toBe("Casual");
  });

  it("normalizes only supported stored mixer intents", () => {
    expect(getStoredOutfitIntent("travel_day")).toBe("travel_day");
    expect(getStoredOutfitIntent("dinner")).toBe("dinner");
    expect(getStoredOutfitIntent("date_night")).toBe(defaultMixerIntent);
    expect(getStoredOutfitIntent(null)).toBe(defaultMixerIntent);
  });
});
