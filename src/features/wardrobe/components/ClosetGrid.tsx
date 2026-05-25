import type { WardrobeItem } from "@/src/domain/wardrobe";
import { GarmentArtwork } from "./GarmentArtwork";

export function ClosetGrid({ items }: { items: WardrobeItem[] }) {
  if (items.length === 0) {
    return (
      <section className="card">
        <strong>No closet items yet</strong>
        <p className="subtle" style={{ marginBottom: 0 }}>
          Add detected garments from the review flow to start your closet.
        </p>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
      {items.map((item) => (
        <article key={item.id} className="card" style={{ minHeight: 170, display: "grid", gap: 8 }}>
          <div style={{ minHeight: 112, display: "grid", placeItems: "center", background: "#f7f4ef", borderRadius: 8 }}>
            <GarmentArtwork token={item.asset.visualToken} />
          </div>
          <strong style={{ fontSize: 13 }}>{item.name}</strong>
          <span className="subtle">{item.category}</span>
        </article>
      ))}
    </section>
  );
}
