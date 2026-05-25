"use client";

import Link from "next/link";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { ClosetGrid } from "@/src/features/wardrobe/components/ClosetGrid";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function ClosetPage() {
  const { state } = useWardrobe();

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

      <div style={{ display: "flex", gap: 8, overflow: "hidden", marginBottom: 14 }}>
        <span className="pill dark">All</span>
        <span className="pill">Tops</span>
        <span className="pill">Bottoms</span>
        <span className="pill">Shoes</span>
      </div>

      <ClosetGrid items={state.closetItems} />
      <BottomNav />
    </AppShell>
  );
}
