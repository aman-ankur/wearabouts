import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WardrobeProvider } from "@/src/features/wardrobe/state/WardrobeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wearabouts",
  description: "Travel-first wardrobe planner",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WardrobeProvider>{children}</WardrobeProvider>
      </body>
    </html>
  );
}
