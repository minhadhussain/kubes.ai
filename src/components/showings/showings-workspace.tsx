"use client";

import { useEffect, useMemo, useState } from "react";

import { useCopilotPageContext } from "@/components/copilot/copilot-context";
import { DataTable } from "@/components/ui/data-table";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";

type ShowingRecord = {
  id: string;
  agentName: string;
  status: string;
  startsAt: string;
  endsAt: string;
  notes: string | null;
  feedback: string | null;
  property: { id: string; title: string; addressLine1: string; locality: string; city: string } | null;
  contact: { id: string; displayName: string } | null;
};

type ShowingsWorkspaceProps = {
  showings: ShowingRecord[];
};

export function ShowingsWorkspace({ showings }: ShowingsWorkspaceProps) {
  const { setPageContext } = useCopilotPageContext();
  const [selectedId, setSelectedId] = useState(showings[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () => showings.filter((showing) => statusFilter === "all" || showing.status === statusFilter),
    [showings, statusFilter]
  );

  const selected = filtered.find((showing) => showing.id === selectedId) ?? showings.find((showing) => showing.id === selectedId) ?? null;
  const todayCount = showings.filter((showing) => new Date(showing.startsAt).toDateString() === new Date().toDateString()).length;
  const upcomingCount = showings.filter((showing) => new Date(showing.startsAt).getTime() >= Date.now() && showing.status === "scheduled").length;
  const completedCount = showings.filter((showing) => showing.status === "completed").length;

  useEffect(() => {
    setPageContext({ entityType: selected ? "showing" : null, entityId: selected?.id ?? null });
  }, [selected, setPageContext]);

  return (
    <div className="section-stack">
      <PageHeader
        label="Showings"
        title="Bookings, tours, and client viewing flow"
        description="Coordinate agents, clients, and properties through upcoming and completed showing activity."
        meta={
          <div className="header-meta-grid">
            <div>
              <p className="section-label">Today</p>
              <strong>{todayCount} showings</strong>
            </div>
            <div>
              <p className="section-label">Upcoming</p>
              <StatusBadge label={`${upcomingCount} scheduled`} tone="accent" />
            </div>
          </div>
        }
        actions={
          <>
            <select className="select-compact" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All showings</option>
              <option value="scheduled">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="button button-compact" type="button">+ Book Showing</button>
          </>
        }
      />

      <div className="metrics-grid">
        <Metric label="Today's showings" value={todayCount} meta="Tours already in today's schedule" tone="accent" status="Live" />
        <Metric label="Upcoming" value={upcomingCount} meta="Future scheduled tours" />
        <Metric label="Completed" value={completedCount} meta="Historical tours with feedback" />
        <Metric label="Cancelled" value={showings.filter((showing) => showing.status === "cancelled").length} meta="Tours that need recovery" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-span-7">
          <SystemPanel label="Showing queue" title="Client and property schedule">
            <DataTable
              columns={[
                {
                  key: "client",
                  header: "Client",
                  render: (row) => (
                    <button className="table-link-button" type="button" onClick={() => setSelectedId(row.id)}>
                      <strong>{row.contact?.displayName ?? "Client"}</strong>
                    </button>
                  )
                },
                { key: "property", header: "Property", render: (row) => <span>{row.property?.addressLine1 ?? "Property"}</span> },
                { key: "time", header: "Date / time", render: (row) => <span>{new Date(row.startsAt).toLocaleString()}</span> },
                { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status} tone={row.status === "scheduled" ? "accent" : row.status === "cancelled" ? "danger" : "neutral"} /> },
                { key: "agent", header: "Agent", render: (row) => <span>{row.agentName}</span> }
              ]}
              rows={filtered}
            />
          </SystemPanel>
        </section>

        <section className="dashboard-span-5">
          <SystemPanel label="Showing detail" title={selected?.property?.title ?? "Select a showing"} grid>
            {selected ? (
              <div className="section-stack compact-stack">
                <div className="detail-grid">
                  <div>
                    <p className="section-label">Client</p>
                    <strong>{selected.contact?.displayName ?? "Unknown"}</strong>
                  </div>
                  <div>
                    <p className="section-label">Property</p>
                    <strong>{selected.property?.addressLine1 ?? "Unknown"}</strong>
                    <p className="table-meta">{selected.property?.locality ?? ""}</p>
                  </div>
                  <div>
                    <p className="section-label">Date</p>
                    <strong>{new Date(selected.startsAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <p className="section-label">Status</p>
                    <StatusBadge label={selected.status} tone={selected.status === "scheduled" ? "accent" : selected.status === "cancelled" ? "danger" : "neutral"} />
                  </div>
                </div>
                <p>{selected.notes ?? "No notes added yet."}</p>
                {selected.feedback ? <p className="table-meta">Feedback: {selected.feedback}</p> : null}
              </div>
            ) : (
              <p>Select a showing to review it.</p>
            )}
          </SystemPanel>
        </section>
      </div>
    </div>
  );
}
