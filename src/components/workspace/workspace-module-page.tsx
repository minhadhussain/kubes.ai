import type { Route } from "next";
import Link from "next/link";
import { ReactNode } from "react";

import { DataTable } from "@/components/ui/data-table";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";

export type WorkspaceAction = {
  label: string;
  href: Route;
  tone?: "primary" | "secondary";
};

export type WorkspaceMetaItem = {
  label: string;
  value: string;
  tone?: "accent" | "neutral" | "warning" | "danger";
};

export type WorkspaceMetric = {
  label: string;
  value: ReactNode;
  meta: string;
  tone?: "default" | "accent";
  status?: string;
};

export type WorkspaceCard = {
  label: string;
  title: string;
  description: string;
  meta: string;
};

export type WorkspaceTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

export type WorkspaceModuleConfig<T> = {
  label: string;
  title: ReactNode;
  description: string;
  meta: WorkspaceMetaItem[];
  actions: WorkspaceAction[];
  metrics: WorkspaceMetric[];
  activityLabel: string;
  activityTitle: string;
  activityItems: TimelineItem[];
  tableLabel: string;
  tableTitle: string;
  tableColumns: WorkspaceTableColumn<T>[];
  tableRows: T[];
  cardsLabel: string;
  cardsTitle: string;
  cards: WorkspaceCard[];
};

export function WorkspaceModulePage<T>({
  label,
  title,
  description,
  meta,
  actions,
  metrics,
  activityLabel,
  activityTitle,
  activityItems,
  tableLabel,
  tableTitle,
  tableColumns,
  tableRows,
  cardsLabel,
  cardsTitle,
  cards
}: WorkspaceModuleConfig<T>) {
  return (
    <div className="section-stack">
      <PageHeader
        label={label}
        title={title}
        description={description}
        meta={
          <div className="header-meta-grid">
            {meta.map((item) => (
              <div key={`${item.label}-${item.value}`}>
                <p className="section-label">{item.label}</p>
                {item.tone ? <StatusBadge label={item.value} tone={item.tone} /> : <strong>{item.value}</strong>}
              </div>
            ))}
          </div>
        }
        actions={
          <>
            {actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className={action.tone === "secondary" ? "button-secondary button-compact" : "button button-compact"}
              >
                {action.label}
              </Link>
            ))}
          </>
        }
      />

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <Metric
            key={metric.label}
            label={metric.label}
            value={metric.value}
            meta={metric.meta}
            tone={metric.tone}
            status={metric.status}
          />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-span-5">
          <SystemPanel label={activityLabel} title={activityTitle} grid>
            <Timeline items={activityItems} />
          </SystemPanel>
        </section>

        <section className="dashboard-span-7">
          <SystemPanel label={tableLabel} title={tableTitle}>
            <DataTable columns={tableColumns} rows={tableRows} />
          </SystemPanel>
        </section>

        <section className="dashboard-span-12">
          <SystemPanel label={cardsLabel} title={cardsTitle}>
            <div className="insight-grid">
              {cards.map((card) => (
                <article key={`${card.label}-${card.title}`} className="insight-card">
                  <p className="section-label">{card.label}</p>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <span className="table-meta">{card.meta}</span>
                </article>
              ))}
            </div>
          </SystemPanel>
        </section>
      </div>
    </div>
  );
}
