import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";

type TopBarProps = {
  organizationName: string;
  userName: string;
};

export function TopBar({ organizationName, userName }: TopBarProps) {
  return (
    <div className="top-bar">
      <div className="top-bar-block">
        <p className="section-label">Operating Layer</p>
        <div>
          <strong>{organizationName}</strong>
          <p className="top-bar-copy">Real estate workflow control center</p>
        </div>
      </div>

      <div className="top-bar-block top-bar-status">
        <StatusBadge label="System online" tone="accent" />
        <span className="top-bar-user">{userName}</span>
      </div>

      <div className="top-bar-actions">
        <Link href="/leads" className="button-secondary button-compact">
          Add lead
        </Link>
        <Link href="/showings" className="button button-compact">
          Book showing
        </Link>
      </div>
    </div>
  );
}
