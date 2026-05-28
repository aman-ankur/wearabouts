import { Trash2 } from "lucide-react";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { ClosetAssetArtwork } from "./ClosetAssetArtwork";

export function ClosetGrid({ items, onDelete }: { items: WardrobeItem[]; onDelete?: (itemId: string) => void }) {
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
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: 13, lineHeight: 1.25 }}>{item.name}</strong>
              <span className="subtle">{item.category}</span>
            </div>
            {onDelete ? (
              <button
                type="button"
                aria-label={`Delete ${item.name}`}
                onClick={() => onDelete(item.id)}
                style={{
                  width: 32,
                  height: 32,
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  background: "var(--white)",
                  color: "var(--ink)",
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                }}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
