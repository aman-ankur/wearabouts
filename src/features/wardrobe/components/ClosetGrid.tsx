import type { WardrobeItem } from "@/src/domain/wardrobe";
import { ClosetAssetArtwork } from "./ClosetAssetArtwork";

export function ClosetGrid({ items }: { items: WardrobeItem[] }) {
  if (items.length === 0) {
    return (
      <section className="card">
        <strong>No wardrobe items yet</strong>
        <p className="subtle" style={{ marginBottom: 0 }}>
          Add detected garments from the review flow to start your wardrobe.
        </p>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
      {items.map((item) => (
        <article key={item.id} className="card" style={{ minHeight: 210, display: "grid", gap: 8 }}>
          <div
            style={{
              height: 152,
              display: "grid",
              placeItems: "center",
              background: "radial-gradient(circle at 50% 48%, rgba(239,233,223,.7), transparent 68%)",
            }}
          >
            <ClosetAssetArtwork asset={item.asset} />
          </div>
          <strong style={{ fontSize: 13 }}>{item.name}</strong>
          <span className="subtle">{item.category}</span>
        </article>
      ))}
    </section>
  );
}
