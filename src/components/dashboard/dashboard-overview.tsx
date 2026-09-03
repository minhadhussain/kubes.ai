import { AiPriorityPanel } from "@/components/dashboard/ai-priority-panel";
import { DataTable } from "@/components/ui/data-table";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";

type AttentionRow = {
  item: string;
  status: string;
  owner: string;
  nextAction: string;
  tone: "accent" | "neutral" | "warning" | "danger";
};

type DashboardOverviewProps = {
  data: {
    organization: {
      name: string;
    };
    today: {
      appointments: number;
      showings: number;
      tasksDue: number;
      overdueTasks: number;
    };
    business: {
      newLeads: number;
      activeClients: number;
      activeListings: number;
      activeTransactions: number;
      pendingOffers: number;
      expectedCommission: number;
    };
    aiSnapshot: {
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
  };
  onRefreshAiPriorities?: () => Promise<void>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function DashboardOverview({ data, onRefreshAiPriorities }: DashboardOverviewProps) {
  const activityItems: TimelineItem[] = [
    {
      time: "Now",
      title: `${data.business.newLeads} lead signals require response`,
      description: "New pipeline volume is sitting in intake and should be triaged into contact and qualification workflows.",
      tone: data.business.newLeads > 0 ? "accent" : "neutral"
    },
    {
      time: "Today",
      title: `${data.today.showings} showing blocks are scheduled`,
      description: "Field activity is already mapped into the operating layer for buyer and seller execution.",
      tone: data.today.showings > 0 ? "accent" : "neutral"
    },
    {
      time: "Queue",
      title: `${data.business.pendingOffers} offers are awaiting movement`,
      description: "Offer review and counter activity should be monitored closely to prevent stale negotiation cycles.",
      tone: data.business.pendingOffers > 0 ? "warning" : "neutral"
    },
    {
      time: "Risk",
      title: `${data.today.overdueTasks} overdue tasks need recovery`,
      description: "Execution debt is building. Recover missed follow-ups and due items before they impact transactions.",
      tone: data.today.overdueTasks > 0 ? "danger" : "neutral"
    }
  ];

  const attentionRows: AttentionRow[] = [
    {
      item: "Follow-up workload",
      status: data.today.overdueTasks > 0 ? "Action required" : "Stable",
      owner: "Tasks",
      nextAction: data.today.overdueTasks > 0 ? "Recover overdue queue" : "Maintain cadence",
      tone: data.today.overdueTasks > 0 ? "danger" : "accent"
    },
    {
      item: "Offer movement",
      status: data.business.pendingOffers > 0 ? "In review" : "Clear",
      owner: "Offers",
      nextAction: data.business.pendingOffers > 0 ? "Respond to negotiations" : "Await next submission",
      tone: data.business.pendingOffers > 0 ? "warning" : "accent"
    },
    {
      item: "Listing pressure",
      status: data.business.activeListings > 0 ? "Live" : "Low inventory",
      owner: "Listings",
      nextAction: data.business.activeListings > 0 ? "Monitor showing activity" : "Source new inventory",
      tone: data.business.activeListings > 0 ? "accent" : "warning"
    }
  ];

  return (
    <div className="dashboard-grid">
      <section className="dashboard-span-12">
        <PageHeader
          label="Today"
          title={
            <>
              Run your real estate
              <br />
              workflow in <span className="text-accent">real time.</span>
            </>
          }
          description="The operating layer surfaces what needs attention now: intake pressure, field activity, active negotiations, and transaction execution risk."
          meta={
            <div className="header-meta-grid">
              <div>
                <p className="section-label">Workspace</p>
                <strong>{data.organization.name}</strong>
              </div>
              <div>
                <p className="section-label">System</p>
                <StatusBadge label="Online" tone="accent" />
              </div>
            </div>
          }
          actions={
            <>
              <a href="#attention" className="button-secondary button-compact">
                Review risks
              </a>
              <a href="#pipeline" className="button button-compact">
                Open pipeline
              </a>
            </>
          }
        />
      </section>

      <section className="dashboard-span-12">
        <div className="metrics-grid">
          <Metric label="Active leads" value={data.business.newLeads} meta="Intake waiting on first contact" tone="accent" status="Live" />
          <Metric label="Showings" value={data.today.showings} meta="Property movement scheduled today" />
          <Metric label="Deals" value={data.business.activeTransactions} meta="Transactions moving toward close" />
          <Metric label="Expected commission" value={formatCurrency(data.business.expectedCommission)} meta="Projected revenue across active pipeline" tone="accent" />
        </div>
      </section>

      <section className="dashboard-span-5">
        <SystemPanel label="System activity" title="Operational stream" grid>
          <Timeline items={activityItems} />
        </SystemPanel>
      </section>

      <section className="dashboard-span-7" id="pipeline">
        <SystemPanel label="AI today" title="Recommended next actions" grid>
          <AiPriorityPanel snapshot={data.aiSnapshot} onRefresh={onRefreshAiPriorities} />
        </SystemPanel>
      </section>

      <section className="dashboard-span-12" id="attention">
        <SystemPanel label="Attention required" title="Priority queue">
          <DataTable
            columns={[
              {
                key: "item",
                header: "Module",
                render: (row) => <strong>{row.item}</strong>
              },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge label={row.status} tone={row.tone} />
              },
              {
                key: "owner",
                header: "Owner",
                render: (row) => <span className="table-meta">{row.owner}</span>
              },
              {
                key: "nextAction",
                header: "Next action",
                render: (row) => <span>{row.nextAction}</span>
              }
            ]}
            rows={attentionRows}
          />
        </SystemPanel>
      </section>

      <section className="dashboard-span-12">
        <SystemPanel label="Today" title="Execution layer">
          <div className="metrics-grid metrics-grid-secondary">
            <Metric label="Appointments" value={data.today.appointments} meta="Meetings, calls, and calendar blocks" />
            <Metric label="Tasks due" value={data.today.tasksDue} meta="Operational work due before day end" />
            <Metric label="Active listings" value={data.business.activeListings} meta="Seller-side inventory in market motion" />
            <Metric label="Pending offers" value={data.business.pendingOffers} meta="Negotiation states currently open" />
          </div>
        </SystemPanel>
      </section>
    </div>
  );
}
