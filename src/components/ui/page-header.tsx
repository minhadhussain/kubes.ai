import { ReactNode } from "react";

import { SectionLabel } from "@/components/ui/section-label";

type PageHeaderProps = {
  label: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({ label, title, description, actions, meta }: PageHeaderProps) {
  return (
    <header className="page-header blueprint-grid">
      <div className="page-header-main">
        <SectionLabel tone="accent">{label}</SectionLabel>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      <div className="page-header-side">
        {meta ? <div className="page-header-meta">{meta}</div> : null}
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
