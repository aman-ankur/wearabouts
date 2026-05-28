import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { ClosetAssetArtwork } from "./ClosetAssetArtwork";

interface MixerRailProps {
  slot: OutfitSlot;
  label: string;
  items: WardrobeItem[];
  selectedItemId: string | null;
  locked: boolean;
  onSelect: (wardrobeItemId: string) => void;
}

export function MixerRail({ slot, label, items, selectedItemId, locked, onSelect }: MixerRailProps) {
  return (
    <section aria-label={`${label} rail`} style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <strong style={{ fontSize: 14 }}>{label}</strong>
        {locked ? <span className="pill">Locked</span> : null}
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 4,
          opacity: locked ? 0.62 : 1,
        }}
      >
        {items.length === 0 ? (
          <div className="card" style={{ minWidth: 180, color: "var(--muted)", fontSize: 13 }}>
            No {label.toLowerCase()} yet
          </div>
        ) : (
          items.map((item) => {
            const selected = item.id === selectedItemId;

            return (
              <button
                key={`${slot}-${item.id}`}
                type="button"
                disabled={locked}
                onClick={() => onSelect(item.id)}
                aria-pressed={selected}
                style={{
                  minWidth: 128,
                  border: `2px solid ${selected ? "var(--ink)" : "var(--line)"}`,
                  borderRadius: 8,
                  background: selected ? "#f5efe5" : "var(--white)",
                  padding: 8,
                  display: "grid",
                  gap: 8,
                  justifyItems: "center",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: "100%",
                    minHeight: 108,
                    display: "grid",
                    placeItems: "center",
                    background: "transparent",
                  }}
                >
                  <ClosetAssetArtwork asset={item.asset} />
                </span>
                <span style={{ width: "100%", fontSize: 12, fontWeight: 720, color: "var(--ink)" }}>{item.name}</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
