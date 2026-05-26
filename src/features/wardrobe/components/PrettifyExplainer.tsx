import { Sparkles } from "lucide-react";
import { GarmentArtwork } from "./GarmentArtwork";

export function PrettifyExplainer() {
  return (
    <section className="card" style={{ background: "var(--dark)", color: "var(--white)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 38px 1fr", gap: 10, alignItems: "center" }}>
        <div style={{ minHeight: 150, borderRadius: 8, display: "grid", placeItems: "center", background: "#3b3b3b" }}>
          <GarmentArtwork token="shirt-striped" />
        </div>
        <div style={{ textAlign: "center", fontSize: 28 }}>→</div>
        <div style={{ minHeight: 150, borderRadius: 8, display: "grid", placeItems: "center", background: "#f7f7f4" }}>
          <GarmentArtwork token="shirt-striped" />
        </div>
      </div>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
        <Sparkles size={18} />
        Auto-Prettify is on
      </h2>
      <p style={{ margin: 0, color: "#c7c7c7", fontSize: 13, lineHeight: 1.45 }}>
        Wearabouts turns messy clothing photos into clean, standardized wardrobe items for review, mixing, and trip
        planning.
      </p>
    </section>
  );
}
