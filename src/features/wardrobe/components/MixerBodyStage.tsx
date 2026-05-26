import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { demoBodyPreview } from "@/src/features/wardrobe/fixtures/demoMixer";
import { GarmentArtwork } from "./GarmentArtwork";

interface MixerBodyStageProps {
  selectedItems: Partial<Record<OutfitSlot, WardrobeItem>>;
}

const boardCellStyle = {
  minHeight: 120,
  border: "1px solid rgba(230,222,212,.9)",
  borderRadius: 8,
  background: "rgba(255,255,255,.72)",
  display: "grid",
  placeItems: "center",
  position: "relative",
  overflow: "hidden",
} satisfies React.CSSProperties;

function BoardItem({ item, scale = 1 }: { item?: WardrobeItem; scale?: number }) {
  if (!item) {
    return <span style={{ width: 54, height: 2, borderRadius: 999, background: "var(--line)" }} />;
  }

  return (
    <div style={{ transform: `scale(${scale})`, display: "grid", placeItems: "center" }}>
      <GarmentArtwork token={item.asset.visualToken} />
    </div>
  );
}

export function MixerBodyStage({ selectedItems }: MixerBodyStageProps) {
  return (
    <section
      aria-label={demoBodyPreview.label}
      style={{
        minHeight: 360,
        border: "1px solid var(--line)",
        borderRadius: 8,
        background:
          "radial-gradient(circle at 50% 18%, rgba(49,90,125,.08), transparent 32%), linear-gradient(180deg, #fbfaf7 0%, #eee8de 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 36,
          right: 36,
          top: 48,
          height: 1,
          background: "rgba(17,17,17,.12)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: 49,
          width: 32,
          height: 18,
          borderLeft: "1px solid rgba(17,17,17,.16)",
          borderRight: "1px solid rgba(17,17,17,.16)",
          borderBottom: "1px solid rgba(17,17,17,.16)",
          borderRadius: "0 0 18px 18px",
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          width: "min(100%, 300px)",
          display: "grid",
          gridTemplateColumns: "1.1fr .9fr",
          gap: 10,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ ...boardCellStyle, minHeight: 178, gridRow: "span 2" }}>
          {selectedItems.layer ? (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 0.32 }}>
              <BoardItem item={selectedItems.layer} scale={1.05} />
            </div>
          ) : null}
          <BoardItem item={selectedItems.top} scale={0.95} />
        </div>
        <div style={{ ...boardCellStyle, minHeight: 178 }}>
          <BoardItem item={selectedItems.bottom} scale={0.92} />
        </div>
        <div style={{ ...boardCellStyle, minHeight: 82 }}>
          <BoardItem item={selectedItems.shoes} scale={1.05} />
        </div>
        <div style={{ ...boardCellStyle, minHeight: 72, gridColumn: "1 / -1" }}>
          <BoardItem item={selectedItems.accessory} scale={0.52} />
        </div>
      </div>
    </section>
  );
}
