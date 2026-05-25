import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell">
      <section className="phone-frame">
        <div className="phone-screen">{children}</div>
      </section>
    </main>
  );
}
