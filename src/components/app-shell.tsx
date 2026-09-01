import Link from "next/link";
import { ReactNode } from "react";

import { appNavigation } from "@/config/navigation";

type AppShellProps = {
  organizationName: string;
  userName: string;
  children: ReactNode;
};

export function AppShell({ organizationName, userName, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Real Estate Agent OS</p>
          <h1>{organizationName}</h1>
          <p className="muted">Built for the full agent workflow.</p>
        </div>

        <nav className="nav-grid" aria-label="Primary">
          {appNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="muted">Signed in as</p>
          <strong>{userName}</strong>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
