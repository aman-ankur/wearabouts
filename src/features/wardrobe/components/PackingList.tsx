import { BaggageClaim } from "lucide-react";
import type { PackingListItem, WardrobeItem } from "@/src/domain/wardrobe";

interface PackingListProps {
  items: PackingListItem[];
  closetItems: WardrobeItem[];
}

export function PackingList({ items, closetItems }: PackingListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="card" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <BaggageClaim size={18} aria-hidden="true" />
        <strong>Packing list</strong>
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        {items.map((item) => {
          const closetItem = closetItems.find((candidate) => candidate.id === item.wardrobeItemId);

          return (
            <div
              key={item.wardrobeItemId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                borderTop: "1px solid var(--line)",
                paddingTop: 9,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 720 }}>{closetItem?.name ?? "Closet item"}</span>
              <span className="pill">{item.wearCount}x</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
