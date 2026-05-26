import { Lock, Unlock } from "lucide-react";
import type { OutfitSlot, OutfitSlotSelection } from "@/src/domain/wardrobe";

interface MixerSlotControlsProps {
  selections: OutfitSlotSelection[];
  onToggleLock: (slot: OutfitSlot) => void;
}

const slotLabels: Record<OutfitSlot, string> = {
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  layer: "Layer",
  accessory: "Accessory",
};

export function MixerSlotControls({ selections, onToggleLock }: MixerSlotControlsProps) {
  return (
    <section aria-label="Mixer slot locks" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
      {selections.map((selection) => {
        const Icon = selection.locked ? Lock : Unlock;

        return (
          <button
            key={selection.slot}
            type="button"
            className={selection.locked ? "pill dark" : "pill"}
            onClick={() => onToggleLock(selection.slot)}
            aria-pressed={selection.locked}
            style={{ border: 0, whiteSpace: "nowrap" }}
          >
            <Icon size={14} aria-hidden="true" />
            {slotLabels[selection.slot]}
          </button>
        );
      })}
    </section>
  );
}
