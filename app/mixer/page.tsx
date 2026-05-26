"use client";

import Link from "next/link";
import { Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { MixerBodyStage } from "@/src/features/wardrobe/components/MixerBodyStage";
import { MixerRail } from "@/src/features/wardrobe/components/MixerRail";
import { MixerSlotControls } from "@/src/features/wardrobe/components/MixerSlotControls";
import { getItemsForSlot, getSelectedItem, mixerSlots } from "@/src/features/wardrobe/selectors/mixerSelectors";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

const slotLabels: Record<OutfitSlot, string> = {
  top: "Tops",
  bottom: "Bottoms",
  shoes: "Shoes",
  layer: "Layers",
  accessory: "Accessories",
};

export default function MixerPage() {
  const {
    state,
    mixerState,
    startMixer,
    selectMixerItem,
    toggleMixerSlotLock,
    saveCurrentOutfit,
  } = useWardrobe();
  const readyItems = useMemo(() => state.closetItems.filter((item) => item.readyForMixer), [state.closetItems]);

  useEffect(() => {
    if (mixerState.selections.length === 0 && readyItems.length > 0) {
      startMixer();
    }
  }, [mixerState.selections.length, readyItems.length, startMixer]);

  const selectedItems = useMemo(() => {
    return mixerState.selections.reduce<Partial<Record<OutfitSlot, WardrobeItem>>>((selected, selection) => {
      const item = getSelectedItem(state.closetItems, selection);
      if (item) {
        selected[selection.slot] = item;
      }

      return selected;
    }, {});
  }, [mixerState.selections, state.closetItems]);

  if (readyItems.length === 0) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Closet Mixer</h1>
            <p className="subtle">Demo preview</p>
          </div>
        </div>

        <section className="card" style={{ display: "grid", gap: 12 }}>
          <strong>No mixer-ready items yet</strong>
          <p className="subtle" style={{ margin: 0 }}>
            Add the demo batch to your closet to start mixing outfits.
          </p>
          <Link className="button" href="/upload">
            Add demo items
          </Link>
        </section>
        <BottomNav />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Closet Mixer</h1>
          <p className="subtle">{mixerState.savedOutfits.length} saved looks</p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => saveCurrentOutfit("Demo travel look", "profile-aankur")}
        >
          <Save size={17} aria-hidden="true" />
          Save
        </button>
      </div>

      <div className="stack">
        <MixerBodyStage selectedItems={selectedItems} />
        <MixerSlotControls selections={mixerState.selections} onToggleLock={toggleMixerSlotLock} />
        {mixerSlots.map((slot) => {
          const selection = mixerState.selections.find((item) => item.slot === slot);

          return (
            <MixerRail
              key={slot}
              slot={slot}
              label={slotLabels[slot]}
              items={getItemsForSlot(state.closetItems, slot)}
              selectedItemId={selection?.wardrobeItemId ?? null}
              locked={selection?.locked ?? false}
              onSelect={(wardrobeItemId) => selectMixerItem(slot, wardrobeItemId)}
            />
          );
        })}
      </div>

      <BottomNav />
    </AppShell>
  );
}
