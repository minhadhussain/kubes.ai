import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";
import { WorkflowStep } from "@/components/ui/workflow-step";

export function OnboardingCta() {
  return (
    <div className="section-stack">
      <PageHeader
        label="Setup"
        title={
          <>
            Finish your workspace
            <br />
            to unlock the <span className="text-accent">dashboard.</span>
          </>
        }
        description="You are signed in successfully. Create your organization once, and the full operating dashboard will be ready right away."
        meta={<StatusBadge label="Sign-in complete" tone="accent" />}
        actions={
          <Link href="/onboarding" className="button button-compact">
            Create workspace
          </Link>
        }
      />

      <SystemPanel label="Next steps" title="Complete onboarding" grid>
        <div className="workflow-grid">
          <WorkflowStep
            index="01"
            title="Create organization"
            description="Set your workspace name and choose the operating setup that matches how you run your business."
            meta="WORKSPACE · ACCESS · SETUP"
          />
          <WorkflowStep
            index="02"
            title="Activate your dashboard"
            description="The app uses your default organization to load leads, showings, tasks, and transaction metrics."
            meta="DATA · DASHBOARD · METRICS"
          />
          <WorkflowStep
            index="03"
            title="Start using modules"
            description="After setup, every section in the sidebar will open inside the protected app shell with your organization context."
            meta="CRM · PIPELINE · EXECUTION"
          />
        </div>
      </SystemPanel>
    </div>
  );
}
