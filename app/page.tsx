import Link from "next/link";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { getRuntimeMode, getRuntimeModeLabel } from "@/src/features/runtime/runtimeMode";

export default function HomePage() {
  const mode = getRuntimeMode();

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Wearabouts</h1>
          <p className="subtle">{getRuntimeModeLabel(mode)}</p>
        </div>
        <span className="pill dark">MVP</span>
      </div>

      <section
        className="card"
        style={{ minHeight: 240, display: "grid", alignContent: "center", gap: 12, background: "#f2ece2" }}
      >
        <span className="pill">Travel wardrobe</span>
        <h2 style={{ fontSize: 42, lineHeight: 0.95, margin: 0 }}>Pack looks, not doubts.</h2>
        <p className="subtle" style={{ margin: 0 }}>
          Upload real clothes, prettify them into wardrobe items, and build trip-ready outfits.
        </p>
      </section>

      <div className="stack" style={{ marginTop: 14 }}>
        <Link className="full-button" href="/upload" style={{ display: "grid", placeItems: "center" }}>
          Add clothes
        </Link>
        <Link className="button secondary" href="/closet" style={{ display: "grid", placeItems: "center" }}>
          View wardrobe
        </Link>
      </div>

      <BottomNav />
    </AppShell>
  );
}
