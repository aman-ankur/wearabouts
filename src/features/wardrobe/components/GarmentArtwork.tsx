import type { ClosetAsset } from "@/src/domain/wardrobe";

interface GarmentArtworkProps {
  token: ClosetAsset["visualToken"];
}

const colorByToken: Record<ClosetAsset["visualToken"], string> = {
  "jacket-brown": "var(--clay)",
  "sweater-cream": "var(--cream)",
  "crew-wine": "var(--wine)",
  "shirt-striped":
    "repeating-linear-gradient(90deg, #d9d5cb 0, #d9d5cb 5px, #6f7777 5px, #6f7777 7px, #f4f1e9 7px, #f4f1e9 12px)",
  "trouser-charcoal": "#252932",
  "shoe-brown": "#3a2118",
};

export function GarmentArtwork({ token }: GarmentArtworkProps) {
  if (token === "trouser-charcoal") {
    return (
      <div aria-label="Trouser artwork" style={{ width: 62, height: 86, position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 6,
            top: 0,
            width: 24,
            height: 86,
            borderRadius: "2px 2px 8px 8px",
            background: colorByToken[token],
          }}
        />
        <span
          style={{
            position: "absolute",
            right: 6,
            top: 0,
            width: 24,
            height: 86,
            borderRadius: "2px 2px 8px 8px",
            background: colorByToken[token],
          }}
        />
      </div>
    );
  }

  if (token === "shoe-brown") {
    return (
      <div
        aria-label="Shoe artwork"
        style={{
          width: 70,
          height: 26,
          borderRadius: "18px 24px 9px 9px",
          background: colorByToken[token],
        }}
      />
    );
  }

  return (
    <div
      aria-label="Garment artwork"
      style={{
        width: 104,
        height: 132,
        position: "relative",
        filter: "drop-shadow(0 8px 10px rgba(0,0,0,.12))",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 27,
          top: 26,
          width: 50,
          height: 82,
          borderRadius: "9px 9px 6px 6px",
          background: colorByToken[token],
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 11,
          top: 35,
          width: 24,
          height: 72,
          borderRadius: 10,
          transform: "rotate(10deg)",
          background: colorByToken[token],
        }}
      />
      <span
        style={{
          position: "absolute",
          right: 11,
          top: 35,
          width: 24,
          height: 72,
          borderRadius: 10,
          transform: "rotate(-10deg)",
          background: colorByToken[token],
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 41,
          top: 22,
          width: 22,
          height: 18,
          borderRadius: "0 0 16px 16px",
          background: "var(--paper)",
        }}
      />
    </div>
  );
}
