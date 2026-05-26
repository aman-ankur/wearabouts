"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { ClosetGrid } from "@/src/features/wardrobe/components/ClosetGrid";
import { SavedOutfitList } from "@/src/features/wardrobe/components/SavedOutfitList";
import {
  getClosetItemsForFilter,
  type ClosetFilter,
} from "@/src/features/wardrobe/selectors/closetSelectors";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

const filters: Array<{ id: ClosetFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "tops", label: "Tops" },
  { id: "bottoms", label: "Bottoms" },
  { id: "shoes", label: "Shoes" },
];

export default function ClosetPage() {
  const { state, mixerState } = useWardrobe();
  const [activeFilter, setActiveFilter] = useState<ClosetFilter>("all");
  const filteredItems = useMemo(
    () => getClosetItemsForFilter(state.closetItems, activeFilter),
    [activeFilter, state.closetItems],
  );

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Closet</h1>
          <p className="subtle">{state.closetItems.length} approved items</p>
        </div>
        <Link className="button secondary" href="/upload">
          Add
        </Link>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeFilter === filter.id ? "pill dark" : "pill"}
            onClick={() => setActiveFilter(filter.id)}
            aria-pressed={activeFilter === filter.id}
            style={{ border: 0, whiteSpace: "nowrap" }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <ClosetGrid items={filteredItems} />
      <div style={{ marginTop: 16 }}>
        <SavedOutfitList outfits={mixerState.savedOutfits} />
      </div>
      <BottomNav />
    </AppShell>
  );
}
