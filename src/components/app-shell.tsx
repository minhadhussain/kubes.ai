import Link from "next/link";
import { ReactNode } from "react";

import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { TopBar } from "@/components/navigation/top-bar";

type AppShellProps = {
  organizationName: string;
  userName: string;
  children: ReactNode;
};

export function AppShell({ organizationName, userName, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="section-label section-label-accent">Kubes.ai</p>
          <h1>{organizationName}</h1>
          <p className="sidebar-copy">Mission control for the full agent workflow.</p>
        </div>

        <SidebarNav />

        <div className="sidebar-footer">
          <p className="section-label">Workspace user</p>
          <strong>{userName}</strong>
          <Link href="/settings" className="inline-link">
            Configure workspace
          </Link>
        </div>
      </aside>

      <main className="content">
        <TopBar organizationName={organizationName} userName={userName} />
        {children}
      </main>
    </div>
  );
}
