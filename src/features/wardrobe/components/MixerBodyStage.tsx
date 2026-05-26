import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { demoBodyPreview } from "@/src/features/wardrobe/fixtures/demoMixer";
import { GarmentArtwork } from "./GarmentArtwork";

interface MixerBodyStageProps {
  selectedItems: Partial<Record<OutfitSlot, WardrobeItem>>;
}

const bodySlotStyle = {
  position: "absolute",
  left: "50%",
  display: "grid",
  placeItems: "center",
  transform: "translateX(-50%)",
  pointerEvents: "none",
} satisfies React.CSSProperties;

export function MixerBodyStage({ selectedItems }: MixerBodyStageProps) {
  return (
    <section
      aria-label={demoBodyPreview.label}
      style={{
        minHeight: 360,
        border: "1px solid var(--line)",
        borderRadius: 8,
        background: "linear-gradient(180deg, #fbfaf7 0%, #ece5db 100%)",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "auto 42px 22px",
          height: 18,
          borderRadius: "50%",
          background: "rgba(17,17,17,.10)",
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          width: 190,
          height: 332,
          position: "relative",
          display: "grid",
          justifyItems: "center",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 10,
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "#d6ad8f",
            border: "2px solid rgba(17,17,17,.08)",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 62,
            width: 92,
            height: 136,
            borderRadius: "38px 38px 26px 26px",
            background: "#d2a483",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 42,
            top: 86,
            width: 25,
            height: 118,
            borderRadius: 18,
            background: "#d2a483",
            transform: "rotate(7deg)",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 42,
            top: 86,
            width: 25,
            height: 118,
            borderRadius: 18,
            background: "#d2a483",
            transform: "rotate(-7deg)",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 68,
            top: 180,
            width: 26,
            height: 120,
            borderRadius: "0 0 18px 18px",
            background: "#d2a483",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 68,
            top: 180,
            width: 26,
            height: 120,
            borderRadius: "0 0 18px 18px",
            background: "#d2a483",
          }}
        />

        {selectedItems.bottom ? (
          <div style={{ ...bodySlotStyle, top: 165, transform: "translateX(-50%) scale(.9)" }}>
            <GarmentArtwork token={selectedItems.bottom.asset.visualToken} />
          </div>
        ) : null}
        {selectedItems.top ? (
          <div style={{ ...bodySlotStyle, top: 68, transform: "translateX(-50%) scale(.82)" }}>
            <GarmentArtwork token={selectedItems.top.asset.visualToken} />
          </div>
        ) : null}
        {selectedItems.layer ? (
          <div style={{ ...bodySlotStyle, top: 58, transform: "translateX(-50%) scale(.96)", opacity: 0.92 }}>
            <GarmentArtwork token={selectedItems.layer.asset.visualToken} />
          </div>
        ) : null}
        {selectedItems.shoes ? (
          <div style={{ ...bodySlotStyle, bottom: 9, transform: "translateX(-50%) scale(1.05)" }}>
            <GarmentArtwork token={selectedItems.shoes.asset.visualToken} />
          </div>
        ) : null}
        {selectedItems.accessory ? (
          <div style={{ ...bodySlotStyle, top: 12, left: "64%", transform: "translateX(-50%) scale(.38)" }}>
            <GarmentArtwork token={selectedItems.accessory.asset.visualToken} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
