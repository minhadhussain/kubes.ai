import { ReactNode } from "react";

type SystemPanelProps = {
  title?: string;
  label?: string;
  actions?: ReactNode;
  grid?: boolean;
  children: ReactNode;
  className?: string;
};

export function SystemPanel({ title, label, actions, grid = false, children, className }: SystemPanelProps) {
  const classes = ["system-panel", grid ? "system-panel-grid" : "", className ?? ""].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      {title || label || actions ? (
        <header className="system-panel-header">
          <div>
            {label ? <p className="section-label">{label}</p> : null}
            {title ? <h2 className="system-panel-title">{title}</h2> : null}
          </div>
          {actions ? <div className="system-panel-actions">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
