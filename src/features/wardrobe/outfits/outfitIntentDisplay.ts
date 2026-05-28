import type { OutfitIntent } from "./outfitTypes";

export const defaultMixerIntent: OutfitIntent = "casual";
export const mixerIntentStorageKey = "wearabouts.mixer.intent";

export const outfitIntentOptions: Array<{ id: OutfitIntent; label: string }> = [
  { id: "casual", label: "Casual" },
  { id: "dinner", label: "Dinner" },
  { id: "travel_day", label: "Travel" },
  { id: "work", label: "Work" },
  { id: "warm_weather", label: "Warm" },
  { id: "rain_ready", label: "Rain" },
];

export function getOutfitIntentLabel(intent: OutfitIntent): string {
  return outfitIntentOptions.find((option) => option.id === intent)?.label ?? "Casual";
}

export function getStoredOutfitIntent(value: string | null): OutfitIntent {
  return outfitIntentOptions.some((option) => option.id === value) ? (value as OutfitIntent) : defaultMixerIntent;
}
