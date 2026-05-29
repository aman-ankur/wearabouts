import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";

export default function EntryPage() {
  return (
    <AppShell>
      <div style={{ minHeight: "100%", display: "grid", alignContent: "center", gap: 22 }}>
        <section style={{ display: "grid", gap: 14 }}>
          <span className="pill dark" style={{ width: "fit-content" }}>
            <Sparkles size={14} aria-hidden="true" />
            Wearabouts
          </span>
          <div style={{ display: "grid", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 0.98 }}>Plan looks from the clothes you own.</h1>
            <p className="subtle" style={{ margin: 0, fontSize: 15 }}>
              Try a polished starter closet instantly, or sign in to build your private wardrobe with photos, outfits,
              trips, and avatar previews.
            </p>
          </div>
        </section>

        <section className="stack" aria-label="Choose how to start">
          <Link className="full-button" href="/demo" style={{ textDecoration: "none" }}>
            Explore demo
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link className="button secondary" href="/login" style={{ minHeight: 54 }}>
            Build your own
          </Link>
        </section>

        <section className="card" style={{ display: "grid", gap: 8 }}>
          <p className="subtle" style={{ margin: 0 }}>
            Demo mode uses sample clothes only. Personal photos and real saves start after email code sign-in.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
