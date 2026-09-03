"use client";

import { useState } from "react";

type AiPriorityPanelProps = {
  snapshot: {
    generatedAt: string;
    items: Array<{
      priority: "high" | "medium" | "low";
      entityType: "lead" | "task" | "transaction" | "contact";
      entityId: string;
      title: string;
      reason: string;
      recommendedAction: string;
      ctaLabel: string;
      confidence: number;
      sources: string[];
    }>;
  } | null;
  onRefresh?: () => Promise<void>;
};

function getEntityHref(entityType: string, entityId: string) {
  if (entityType === "lead") {
    return `/leads#${entityId}`;
  }

  if (entityType === "task") {
    return `/tasks#${entityId}`;
  }

  return "/dashboard";
}

export function AiPriorityPanel({ snapshot, onRefresh }: AiPriorityPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    if (!onRefresh) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onRefresh();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh AI priorities.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-stack compact-stack">
      {onRefresh ? (
        <div className="helper-row">
          <button className="button button-compact" type="button" onClick={handleRefresh} disabled={loading}>
            {loading ? "Generating..." : "Refresh AI priorities"}
          </button>
          {error ? <p className="message message-error">{error}</p> : null}
        </div>
      ) : null}

      {snapshot?.items?.length ? (
        snapshot.items.slice(0, 4).map((item) => (
          <article key={`${item.entityType}-${item.entityId}-${item.title}`} className="ai-priority-card">
            <div className="ai-priority-head">
              <p className="section-label">{item.priority} priority</p>
              <span className="table-meta">Confidence {Math.round(item.confidence * 100)}%</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.reason}</p>
            <p className="table-meta">Recommended: {item.recommendedAction}</p>
            <a href={getEntityHref(item.entityType, item.entityId)} className="inline-link">
              {item.ctaLabel}
            </a>
          </article>
        ))
      ) : (
        <p>No AI recommendations yet. Generate next actions from real leads and tasks when enough activity exists.</p>
      )}
    </div>
  );
}
