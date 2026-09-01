import { MetricCard } from "@/components/dashboard/metric-card";

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
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  return (
    <div className="dashboard-grid">
      <section className="hero-panel">
        <p className="eyebrow">Daily command center</p>
        <h2>{data.organization.name}</h2>
        <p className="hero-copy">
          Start with the items that move your pipeline today: appointments, follow-ups, active deals, and revenue at risk.
        </p>
      </section>

      <section>
        <div className="section-header">
          <div>
            <p className="eyebrow">Today</p>
            <h3>Execution queue</h3>
          </div>
        </div>
        <div className="card-grid">
          <MetricCard label="Appointments" value={data.today.appointments} helper="Meetings, calls, and calendar items today" />
          <MetricCard label="Showings" value={data.today.showings} helper="Buyer and seller property activity" />
          <MetricCard label="Tasks due" value={data.today.tasksDue} helper="Action items due before day end" />
          <MetricCard label="Overdue" value={data.today.overdueTasks} helper="Tasks already slipping behind" />
        </div>
      </section>

      <section>
        <div className="section-header">
          <div>
            <p className="eyebrow">Business</p>
            <h3>Pipeline health</h3>
          </div>
        </div>
        <div className="card-grid">
          <MetricCard label="New leads" value={data.business.newLeads} helper="Fresh prospects needing response" />
          <MetricCard label="Active clients" value={data.business.activeClients} helper="Clients currently in motion" />
          <MetricCard label="Active listings" value={data.business.activeListings} helper="Listings requiring seller-side execution" />
          <MetricCard label="Active transactions" value={data.business.activeTransactions} helper="Deals moving toward close" />
          <MetricCard label="Pending offers" value={data.business.pendingOffers} helper="Offers awaiting review or reply" />
          <MetricCard label="Expected commission" value={formatCurrency(data.business.expectedCommission)} helper="Projected commission across current deals" />
        </div>
      </section>
    </div>
  );
}
