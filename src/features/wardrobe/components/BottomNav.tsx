import Link from "next/link";
import { CalendarDays, Home, Plus, Shirt, Shuffle } from "lucide-react";

const navLinkStyle = {
  display: "grid",
  justifyItems: "center",
  gap: 3,
  fontSize: 11,
} satisfies React.CSSProperties;

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 58,
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        alignItems: "center",
        borderTop: "1px solid var(--line)",
        background: "rgba(255,255,255,.94)",
      }}
    >
      <Link href="/" style={navLinkStyle}>
        <Home size={18} />
        Home
      </Link>
      <Link href="/closet" style={navLinkStyle}>
        <Shirt size={18} />
        Wardrobe
      </Link>
      <Link href="/upload" style={navLinkStyle}>
        <Plus size={18} />
        Add
      </Link>
      <Link href="/mixer" style={navLinkStyle}>
        <Shuffle size={18} />
        Mixer
      </Link>
      <Link href="/trips" style={navLinkStyle}>
        <CalendarDays size={18} />
        Trips
      </Link>
    </nav>
  );
}
