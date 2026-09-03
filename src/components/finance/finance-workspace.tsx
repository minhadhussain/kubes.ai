import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { SystemPanel } from "@/components/ui/system-panel";
import { DataTable } from "@/components/ui/data-table";

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

type FinanceSummary = {
  expectedIncome: number;
  transactionCount: number;
  averageCommission: number;
  closingsSoon: Array<{
    id: string;
    closingDate: string | null;
    commission: number;
    salePrice: number;
    stage: string;
  }>;
};

export function FinanceWorkspace({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="section-stack">
      <PageHeader
        label="Finance"
        title="Commission pipeline and seeded revenue outlook"
        description="Track expected income from the connected seeded transaction pipeline."
      />

      <div className="metrics-grid">
        <Metric label="Expected income" value={currency(summary.expectedIncome)} meta="Current commission pipeline" tone="accent" status="Live" />
        <Metric label="Transactions" value={summary.transactionCount} meta="Revenue-linked deal files" />
        <Metric label="Average commission" value={currency(summary.averageCommission)} meta="Mean income per active deal" />
        <Metric label="Closing soon" value={summary.closingsSoon.length} meta="Upcoming closings in the seeded pipeline" />
      </div>

      <SystemPanel label="Closings" title="Near-term revenue movement">
        <DataTable
          columns={[
            { key: "stage", header: "Stage", render: (row) => <strong>{row.stage.replace(/_/g, " ")}</strong> },
            { key: "value", header: "Deal value", render: (row) => <span>{currency(row.salePrice)}</span> },
            { key: "commission", header: "Commission", render: (row) => <span>{currency(row.commission)}</span> },
            { key: "closing", header: "Closing date", render: (row) => <span>{row.closingDate ?? "TBD"}</span> }
          ]}
          rows={summary.closingsSoon}
        />
      </SystemPanel>
    </div>
  );
}
