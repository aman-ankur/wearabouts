import { Check, RefreshCw } from "lucide-react";
import type { TripDay, TripLook, WardrobeItem } from "@/src/domain/wardrobe";
import { getSelectedItem } from "@/src/features/wardrobe/selectors/mixerSelectors";
import { GarmentArtwork } from "./GarmentArtwork";

interface TripLookCardProps {
  day: TripDay;
  look: TripLook;
  closetItems: WardrobeItem[];
  onApprove: (lookId: string) => void;
  onSwap: (lookId: string) => void;
}

export function TripLookCard({ day, look, closetItems, onApprove, onSwap }: TripLookCardProps) {
  const selectedItems = look.selections
    .map((selection) => getSelectedItem(closetItems, selection))
    .filter((item): item is WardrobeItem => Boolean(item));

  return (
    <article className="card" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <p className="subtle" style={{ margin: 0 }}>
            {day.label} · {day.dateLabel} · {day.activity}
          </p>
          <h2 style={{ fontSize: 18, lineHeight: 1.1, margin: "4px 0 0" }}>{look.title}</h2>
        </div>
        <span className={look.status === "approved" ? "pill dark" : "pill"}>{look.status}</span>
      </div>

      <div
        style={{
          minHeight: 112,
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
          borderRadius: 8,
          background: "#f7f4ef",
          padding: 10,
        }}
      >
        {selectedItems.map((item) => (
          <div
            key={`${look.id}-${item.id}`}
            style={{
              flex: "0 0 72px",
              minHeight: 88,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            <div style={{ transform: "scale(.62)" }}>
              <GarmentArtwork token={item.asset.visualToken} />
            </div>
          </div>
        ))}
      </div>

      <p className="subtle" style={{ margin: 0 }}>
        {look.note}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button type="button" className="button secondary" onClick={() => onSwap(look.id)}>
          <RefreshCw size={16} aria-hidden="true" />
          Swap
        </button>
        <button
          type="button"
          className={look.status === "approved" ? "button ghost" : "button"}
          onClick={() => onApprove(look.id)}
          disabled={look.status === "approved"}
        >
          <Check size={16} aria-hidden="true" />
          {look.status === "approved" ? "Approved" : "Approve"}
        </button>
      </div>
    </article>
  );
}
