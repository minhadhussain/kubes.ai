import { ReactNode } from "react";

import { StatusBadge } from "@/components/ui/status-badge";

type MetricProps = {
  label: string;
  value: ReactNode;
  meta: string;
  tone?: "default" | "accent";
  status?: string;
};

export function Metric({ label, value, meta, tone = "default", status }: MetricProps) {
  return (
    <article className={`metric metric-${tone}`}>
      <div className="metric-topline">
        <p className="metric-label">{label}</p>
        {status ? <StatusBadge label={status} tone={tone === "accent" ? "accent" : "neutral"} /> : null}
      </div>
      <strong className="metric-value">{value}</strong>
      <p className="metric-meta">{meta}</p>
    </article>
  );
}
