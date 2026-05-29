import Link from "next/link";
import { Home, Plus, Shirt, Shuffle, Sparkles } from "lucide-react";

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
        position: "fixed",
        left: "50%",
        bottom: 18,
        width: "min(calc(100vw - 24px), 428px)",
        transform: "translateX(-50%)",
        zIndex: 30,
        height: 58,
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        alignItems: "center",
        borderTop: "1px solid var(--line)",
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        background: "rgba(255,255,255,.94)",
        backdropFilter: "blur(14px)",
      }}
    >
      <Link href="/demo" style={navLinkStyle}>
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
      <Link href="/stylist" style={navLinkStyle}>
        <Sparkles size={18} />
        Stylist
      </Link>
    </nav>
  );
}
