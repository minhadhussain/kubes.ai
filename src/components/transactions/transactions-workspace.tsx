"use client";

import { useEffect, useMemo, useState } from "react";

import { useCopilotPageContext } from "@/components/copilot/copilot-context";
import { DataTable } from "@/components/ui/data-table";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";

type TransactionRecord = {
  id: string;
  stage: string;
  salePrice: number;
  closingDate: string | null;
  commission: number;
  riskLevel: string;
  summary: string;
  property: { id: string; title: string; addressLine1: string; locality: string; city: string } | null;
  buyer: { id: string; displayName: string } | null;
  seller: { id: string; displayName: string } | null;
  tasks: Array<{ id: string; title: string; dueAt: string | null; status: string }>;
  documents: Array<{ id: string; fileName: string; category: string; status: string }>;
};

type TransactionsWorkspaceProps = {
  transactions: TransactionRecord[];
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

const stageLabels = ["Offer", "Contract", "Inspection", "Appraisal", "Financing", "Closing"];

export function TransactionsWorkspace({ transactions }: TransactionsWorkspaceProps) {
  const { setPageContext } = useCopilotPageContext();
  const [selectedId, setSelectedId] = useState(transactions[0]?.id ?? null);
  const [stageFilter, setStageFilter] = useState("all");

  const filtered = useMemo(
    () => transactions.filter((transaction) => stageFilter === "all" || transaction.stage === stageFilter),
    [stageFilter, transactions]
  );

  const selected = filtered.find((transaction) => transaction.id === selectedId) ?? transactions.find((transaction) => transaction.id === selectedId) ?? null;
  useEffect(() => {
    setPageContext({ entityType: selected ? "transaction" : null, entityId: selected?.id ?? null });
  }, [selected, setPageContext]);

  const totalCommission = transactions.reduce((sum, transaction) => sum + transaction.commission, 0);
  const timelineItems: TimelineItem[] = selected
    ? selected.tasks.slice(0, 4).map((task) => ({
        time: task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "No due date",
        title: task.title,
        description: `Status: ${task.status}`,
        tone: task.status === "completed" ? "accent" : "warning"
      }))
    : [];

  return (
    <div className="section-stack">
      <PageHeader
        label="Transactions"
        title="Accepted deals through closing"
        description="Run active deal files with connected buyer, seller, property, tasks, documents, deadlines, and commission outlook."
        meta={
          <div className="header-meta-grid">
            <div>
              <p className="section-label">Pipeline</p>
              <strong>{transactions.length} live files</strong>
            </div>
            <div>
              <p className="section-label">Commission</p>
              <StatusBadge label={currency(totalCommission)} tone="accent" />
            </div>
          </div>
        }
        actions={
          <select className="select-compact" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
            <option value="all">All stages</option>
            <option value="under_contract">Contract</option>
            <option value="inspection">Inspection</option>
            <option value="appraisal">Appraisal</option>
            <option value="financing">Financing</option>
            <option value="closing">Closing</option>
            <option value="closed">Closed</option>
          </select>
        }
      />

      <div className="metrics-grid">
        <Metric label="Active transactions" value={transactions.length} meta="Connected seeded transaction records" tone="accent" status="Live" />
        <Metric label="Closing this month" value={transactions.filter((transaction) => transaction.closingDate && new Date(transaction.closingDate).getMonth() === new Date().getMonth()).length} meta="Near-term expected closings" />
        <Metric label="Financing" value={transactions.filter((transaction) => transaction.stage === "financing").length} meta="Deals waiting on lender clearance" />
        <Metric label="At risk" value={transactions.filter((transaction) => transaction.riskLevel === "high" || transaction.riskLevel === "watch").length} meta="Files needing proactive attention" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-span-12">
          <SystemPanel label="Deal board" title="Transactions by stage">
            <DataTable
              columns={[
                {
                  key: "property",
                  header: "Property",
                  render: (row) => (
                    <button className="table-link-button" type="button" onClick={() => setSelectedId(row.id)}>
                      <strong>{row.property?.addressLine1 ?? "Transaction"}</strong>
                    </button>
                  )
                },
                { key: "buyer", header: "Buyer", render: (row) => <span>{row.buyer?.displayName ?? "Buyer"}</span> },
                { key: "seller", header: "Seller", render: (row) => <span>{row.seller?.displayName ?? "Seller"}</span> },
                { key: "value", header: "Deal value", render: (row) => <span>{currency(row.salePrice)}</span> },
                { key: "stage", header: "Stage", render: (row) => <StatusBadge label={row.stage.replace(/_/g, " ")} tone={row.riskLevel === "high" ? "danger" : row.riskLevel === "watch" ? "warning" : "accent"} /> },
                { key: "closing", header: "Closing", render: (row) => <span>{row.closingDate ?? "TBD"}</span> }
              ]}
              rows={filtered}
            />
          </SystemPanel>
        </section>

        <section className="dashboard-span-12">
          <SystemPanel label="Transaction detail" title={selected?.property?.title ?? "Select a transaction"} grid>
            {selected ? (
              <div className="section-stack compact-stack">
                <div className="detail-grid">
                  <div>
                    <p className="section-label">Property</p>
                    <strong>{selected.property?.addressLine1 ?? "Unknown"}</strong>
                  </div>
                  <div>
                    <p className="section-label">Deal value</p>
                    <strong>{currency(selected.salePrice)}</strong>
                  </div>
                  <div>
                    <p className="section-label">Buyer</p>
                    <strong>{selected.buyer?.displayName ?? "Unknown"}</strong>
                  </div>
                  <div>
                    <p className="section-label">Seller</p>
                    <strong>{selected.seller?.displayName ?? "Unknown"}</strong>
                  </div>
                  <div>
                    <p className="section-label">Current stage</p>
                    <strong>{selected.stage.replace(/_/g, " ")}</strong>
                  </div>
                  <div>
                    <p className="section-label">Closing date</p>
                    <strong>{selected.closingDate ?? "TBD"}</strong>
                  </div>
                </div>
                <p>{selected.summary}</p>
              </div>
            ) : (
              <p>Select a transaction to review it.</p>
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-5">
          <SystemPanel label="Progress" title="Offer to close" grid>
            {selected ? (
              <div className="progress-steps">
                {stageLabels.map((label) => (
                  <div key={label} className={`progress-step ${selected.stage.toLowerCase().includes(label.toLowerCase()) || (label === "Contract" && selected.stage === "under_contract") ? "progress-step-active" : ""}`}>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Select a transaction to see milestone progress.</p>
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-7">
          <SystemPanel label="Tasks and deadlines" title="Execution queue">
            {selected ? (
              selected.tasks.length > 0 ? <Timeline items={timelineItems} /> : <p>No transaction tasks yet.</p>
            ) : (
              <p>Select a transaction to review linked tasks.</p>
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-12">
          <SystemPanel label="Participants and documents" title="Linked records">
            {selected ? (
              <div className="insight-grid">
                <article className="insight-card">
                  <p className="section-label">Participants</p>
                  <h3>{selected.buyer?.displayName ?? "Buyer"}</h3>
                  <p>{selected.seller?.displayName ?? "Seller"}</p>
                </article>
                <article className="insight-card">
                  <p className="section-label">Documents</p>
                  <h3>{selected.documents.length}</h3>
                  <p>{selected.documents[0]?.fileName ?? "No linked files yet."}</p>
                </article>
                <article className="insight-card">
                  <p className="section-label">Commission</p>
                  <h3>{currency(selected.commission)}</h3>
                  <p>Expected agent income from this file.</p>
                </article>
              </div>
            ) : (
              <p>Select a transaction to inspect participants and documents.</p>
            )}
          </SystemPanel>
        </section>
      </div>
    </div>
  );
}
