import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { WorkflowStep } from "@/components/ui/workflow-step";

export default function HomePage() {
  return (
    <main className="marketing-layout">
      <section className="marketing-card">
        <div className="marketing-copy">
          <p className="section-label section-label-accent">Real estate operating system</p>
          <h1>
            Manage your
            <br />
            real estate
            <br />
            workflow <span className="text-accent">as a system.</span>
          </h1>
          <p>
            Built as a control layer for agents who need leads, contacts, showings, offers, transactions, documents, and
            commissions connected in one dark, technical workspace.
          </p>

          <div className="helper-row">
            <Link href="/login" className="button">
              Sign in
            </Link>
            <Link href="/signup" className="button-secondary">
              Create account
            </Link>
          </div>

          <ul className="marketing-list">
            <li>Single source of truth across contacts, leads, properties, offers, and transactions</li>
            <li>Supabase-backed auth, storage, schema, and tenant isolation</li>
            <li>Workflow-first system design instead of disconnected CRM screens</li>
          </ul>
        </div>

        <div className="marketing-side">
          <div>
            <p className="section-label">System status</p>
            <StatusBadge label="Foundation online" tone="accent" />
          </div>

          <div className="workflow-grid workflow-grid-marketing">
            <WorkflowStep index="01" title="Lead intake" description="Capture and qualify prospects without spreadsheet drift." meta="CRM · FORMS · PIPELINE" />
            <WorkflowStep index="02" title="Property motion" description="Track listings, tours, and recommendations inside one system." meta="PROPERTY · SHOWINGS · FEEDBACK" />
            <WorkflowStep index="03" title="Deal execution" description="Move offers into transactions, deadlines, and commission outcomes." meta="OFFER · CLOSE · FINANCE" />
          </div>
        </div>
      </section>
    </main>
  );
}
