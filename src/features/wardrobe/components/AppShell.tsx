import type { ReactNode } from "react";
import { ActiveProfileSwitcher } from "@/src/features/account/ActiveProfileSwitcher";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell">
      <section className="phone-frame">
        <div className="phone-screen">
          <ActiveProfileSwitcher />
          {children}
        </div>
      </section>
    </main>
  );
}
