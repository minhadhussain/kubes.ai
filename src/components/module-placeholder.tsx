import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";
import { WorkflowStep } from "@/components/ui/workflow-step";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  priority: "P0" | "P1" | "P2";
};

export function ModulePlaceholder({ title, description, priority }: ModulePlaceholderProps) {
  return (
    <div className="section-stack">
      <PageHeader
        label="Module"
        title={title.toUpperCase()}
        description={description}
        meta={<StatusBadge label={`${priority} priority`} tone={priority === "P0" ? "accent" : "neutral"} />}
      />

      <SystemPanel label="Blueprint" title="Implementation path" grid>
        <div className="workflow-grid">
          <WorkflowStep index="01" title="Data model" description="Wire the module to the relational Supabase schema and organization-scoped records." meta="SCHEMA · RLS · VALIDATION" />
          <WorkflowStep index="02" title="Service layer" description="Add modular business logic, API handlers, and workflow-safe mutations before UI depth." meta="SERVICE · ROUTES · AUTHZ" />
          <WorkflowStep index="03" title="Operational UI" description="Ship task-focused screens that fit the system shell and real working state." meta="TABLES · FORMS · TIMELINES" />
          <WorkflowStep index="04" title="Workflow verification" description="Test permissions, responsive behavior, and module interactions before moving to the next stage." meta="TESTING · INTEGRATION · QA" />
        </div>
      </SystemPanel>
    </div>
  );
}
