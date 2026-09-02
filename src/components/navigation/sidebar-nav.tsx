"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appNavigation } from "@/config/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav" aria-label="Primary">
      {appNavigation.map((item, index) => {
        const isActive = pathname === item.href;

        return (
          <Link key={item.href} href={item.href} className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}>
            <span className="sidebar-link-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
