"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useCopilotPageContext } from "@/components/copilot/copilot-context";
import { DataTable } from "@/components/ui/data-table";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";

type AiArtifact = {
  id: string;
  artifact_type: "lead_qualification" | "activity_summary" | "follow_up_draft";
  summary: string | null;
  content: Record<string, unknown>;
  confidence: number | null;
  approval_status: "pending_review" | "approved" | "rejected";
  action_status: "draft" | "pending" | "saved" | "approved" | "executed" | "failed" | "cancelled";
  created_at: string;
};

type Lead = {
  id: string;
  stage: "new" | "contacted" | "qualified" | "active" | "offer" | "closed";
  disposition: "open" | "nurture" | "cold" | "lost" | "converted";
  score: number;
  source: string | null;
  notes: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  contact: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    budget: number | null;
    locationRequirements: string | null;
    timeline: string | null;
    leadSource: string | null;
    lastContactedAt: string | null;
    nextFollowUpAt: string | null;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    due_at: string | null;
  }>;
  activities: Array<{
    id: string;
    activity_type: string;
    title: string;
    body: string | null;
    occurred_at: string;
  }>;
  aiArtifacts: AiArtifact[];
};

type LeadsWorkspaceProps = {
  initialLeads: Lead[];
};

const emptyLeadForm = {
  displayName: "",
  email: "",
  phone: "",
  leadSource: "",
  budget: "",
  locationRequirements: "",
  timeline: "",
  requirements: "",
  notes: ""
};

export function LeadsWorkspace({ initialLeads }: LeadsWorkspaceProps) {
  const { setPageContext } = useCopilotPageContext();
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [leadFormError, setLeadFormError] = useState<string | null>(null);
  const [leadFormSubmitting, setLeadFormSubmitting] = useState(false);
  const [activityDraft, setActivityDraft] = useState("");
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoadingKey, setAiLoadingKey] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  useEffect(() => {
    setPageContext({ entityType: selectedLead ? "lead" : null, entityId: selectedLead?.id ?? null });
  }, [selectedLead, setPageContext]);

  const stageCounts = useMemo(() => {
    return {
      new: leads.filter((lead) => lead.stage === "new").length,
      qualified: leads.filter((lead) => lead.stage === "qualified").length,
      active: leads.filter((lead) => lead.stage === "active").length,
      followUps: leads.filter((lead) => Boolean(lead.nextFollowUpAt || lead.contact.nextFollowUpAt)).length
    };
  }, [leads]);

  async function refreshLeads(preferredLeadId?: string) {
    const response = await fetch("/api/leads", { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message ?? "Unable to reload leads.");
    }

    setLeads(result.data);
    setSelectedLeadId(preferredLeadId ?? result.data[0]?.id ?? null);
  }

  async function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadFormSubmitting(true);
    setLeadFormError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadForm,
          budget: leadForm.budget ? Number(leadForm.budget) : undefined,
          priority: "high"
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to create lead.");
      }

      await refreshLeads(result.data.leadId);
      setLeadForm(emptyLeadForm);
      setCreating(false);
    } catch (error) {
      setLeadFormError(error instanceof Error ? error.message : "Unable to create lead.");
    } finally {
      setLeadFormSubmitting(false);
    }
  }

  async function handleAddActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedLead) {
      return;
    }

    setActivitySubmitting(true);
    setActivityError(null);

    try {
      const response = await fetch(`/api/leads/${selectedLead.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: activityDraft, activityType: "note" })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to save activity.");
      }

      setActivityDraft("");
      await refreshLeads(selectedLead.id);
    } catch (error) {
      setActivityError(error instanceof Error ? error.message : "Unable to save activity.");
    } finally {
      setActivitySubmitting(false);
    }
  }

  async function handleGenerateAi(kind: "qualification" | "summary" | "follow-up") {
    if (!selectedLead) {
      return;
    }

    setAiError(null);
    setAiLoadingKey(kind);

    const routeMap = {
      qualification: `/api/ai/leads/${selectedLead.id}/qualification`,
      summary: `/api/ai/leads/${selectedLead.id}/summary`,
      "follow-up": `/api/ai/leads/${selectedLead.id}/follow-up`
    } as const;

    try {
      const response = await fetch(routeMap[kind], { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "AI request failed.");
      }

      await refreshLeads(selectedLead.id);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI request failed.");
    } finally {
      setAiLoadingKey(null);
    }
  }

  async function handleReviewArtifact(artifactId: string, approvalStatus: "approved" | "rejected") {
    setAiError(null);

    try {
      const response = await fetch(`/api/ai/artifacts/${artifactId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to update AI review state.");
      }

      if (selectedLead) {
        await refreshLeads(selectedLead.id);
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to update AI review state.");
    }
  }

  async function handleSaveDraft(artifactId: string) {
    setAiError(null);

    try {
      const response = await fetch(`/api/ai/artifacts/${artifactId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionStatus: "saved" })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to save AI draft.");
      }

      if (selectedLead) {
        await refreshLeads(selectedLead.id);
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to save AI draft.");
    }
  }

  const timelineItems: TimelineItem[] = (selectedLead?.activities ?? []).slice(0, 5).map((activity) => ({
    time: new Date(activity.occurred_at).toLocaleDateString(),
    title: activity.title,
    description: activity.body ?? "No details recorded.",
    tone: activity.activity_type === "note" ? "neutral" : "accent"
  }));

  const leadQualification = selectedLead?.aiArtifacts.find((artifact) => artifact.artifact_type === "lead_qualification");
  const leadSummary = selectedLead?.aiArtifacts.find((artifact) => artifact.artifact_type === "activity_summary");
  const followUpDraft = selectedLead?.aiArtifacts.find((artifact) => artifact.artifact_type === "follow_up_draft");

  return (
    <div className="section-stack">
      <PageHeader
        label="Leads"
        title="Lead pipeline and AI qualification"
        description="Work real inbound leads, keep context attached, and generate reviewed AI outputs from actual CRM activity."
        meta={
          <div className="header-meta-grid">
            <div>
              <p className="section-label">Pipeline</p>
              <strong>{leads.length} tracked leads</strong>
            </div>
            <div>
              <p className="section-label">AI mode</p>
              <StatusBadge label="Review required" tone="warning" />
            </div>
          </div>
        }
        actions={
          <>
            <button className="button-secondary button-compact" type="button" onClick={() => setCreating((current) => !current)}>
              {creating ? "Close form" : "Add lead"}
            </button>
            {selectedLead ? (
              <button className="button button-compact" type="button" onClick={() => handleGenerateAi("qualification")}>
                {aiLoadingKey === "qualification" ? "Generating..." : "Qualify with AI"}
              </button>
            ) : null}
          </>
        }
      />

      <div className="metrics-grid">
        <Metric label="New" value={stageCounts.new} meta="Leads waiting for first contact" tone="accent" status="Live" />
        <Metric label="Qualified" value={stageCounts.qualified} meta="Ready for active follow-through" />
        <Metric label="Active" value={stageCounts.active} meta="Converted into live pipeline motion" />
        <Metric label="Follow-ups" value={stageCounts.followUps} meta="Leads with a next-touch target" />
      </div>

      {creating ? (
        <SystemPanel label="Create lead" title="Capture a new opportunity">
          <form className="section-stack" onSubmit={handleCreateLead}>
            <div className="form-grid-two">
              <div className="field">
                <label htmlFor="lead-name">Display name</label>
                <input id="lead-name" value={leadForm.displayName} onChange={(event) => setLeadForm((current) => ({ ...current, displayName: event.target.value }))} required />
              </div>
              <div className="field">
                <label htmlFor="lead-email">Email</label>
                <input id="lead-email" type="email" value={leadForm.email} onChange={(event) => setLeadForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="lead-phone">Phone</label>
                <input id="lead-phone" value={leadForm.phone} onChange={(event) => setLeadForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="lead-source">Lead source</label>
                <input id="lead-source" value={leadForm.leadSource} onChange={(event) => setLeadForm((current) => ({ ...current, leadSource: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="lead-budget">Budget</label>
                <input id="lead-budget" type="number" value={leadForm.budget} onChange={(event) => setLeadForm((current) => ({ ...current, budget: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="lead-timeline">Timeline</label>
                <input id="lead-timeline" value={leadForm.timeline} onChange={(event) => setLeadForm((current) => ({ ...current, timeline: event.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="lead-location">Location requirements</label>
              <input id="lead-location" value={leadForm.locationRequirements} onChange={(event) => setLeadForm((current) => ({ ...current, locationRequirements: event.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="lead-requirements">Requirements</label>
              <textarea id="lead-requirements" value={leadForm.requirements} onChange={(event) => setLeadForm((current) => ({ ...current, requirements: event.target.value }))} rows={4} />
            </div>
            <div className="field">
              <label htmlFor="lead-notes">Initial note</label>
              <textarea id="lead-notes" value={leadForm.notes} onChange={(event) => setLeadForm((current) => ({ ...current, notes: event.target.value }))} rows={4} />
            </div>
            {leadFormError ? <p className="message message-error">{leadFormError}</p> : null}
            <div className="helper-row">
              <button className="button" type="submit" disabled={leadFormSubmitting}>
                {leadFormSubmitting ? "Creating..." : "Create lead"}
              </button>
            </div>
          </form>
        </SystemPanel>
      ) : null}

      {leads.length === 0 ? (
        <SystemPanel label="Leads" title="No leads yet">
          <p>Create your first lead to start qualification, activity capture, follow-up tasks, and AI review flows.</p>
        </SystemPanel>
      ) : (
        <div className="dashboard-grid">
          <section className="dashboard-span-7">
            <SystemPanel label="Lead queue" title="Real lead workspace">
              <DataTable
                columns={[
                  {
                    key: "lead",
                    header: "Lead",
                    render: (row) => (
                      <button className="table-link-button" type="button" onClick={() => setSelectedLeadId(row.id)}>
                        <strong>{row.contact.displayName}</strong>
                      </button>
                    )
                  },
                  {
                    key: "stage",
                    header: "Stage",
                    render: (row) => <StatusBadge label={row.stage} tone={row.stage === "qualified" || row.stage === "active" ? "accent" : "neutral"} />
                  },
                  {
                    key: "score",
                    header: "Score",
                    render: (row) => <span>{row.score}</span>
                  },
                  {
                    key: "source",
                    header: "Source",
                    render: (row) => <span className="table-meta">{row.source ?? row.contact.leadSource ?? "Direct"}</span>
                  },
                  {
                    key: "next",
                    header: "Next step",
                    render: (row) => <span>{row.tasks[0]?.title ?? "Await qualification"}</span>
                  }
                ]}
                rows={leads}
              />
            </SystemPanel>
          </section>

          <section className="dashboard-span-5">
            {selectedLead ? (
              <SystemPanel label="Selected lead" title={selectedLead.contact.displayName} grid>
                <div className="section-stack compact-stack">
                  <div className="detail-grid">
                    <div>
                      <p className="section-label">Stage</p>
                      <StatusBadge label={selectedLead.stage} tone={selectedLead.stage === "qualified" || selectedLead.stage === "active" ? "accent" : "neutral"} />
                    </div>
                    <div>
                      <p className="section-label">Budget</p>
                      <strong>{selectedLead.contact.budget ? `$${Number(selectedLead.contact.budget).toLocaleString()}` : "Unknown"}</strong>
                    </div>
                    <div>
                      <p className="section-label">Location</p>
                      <strong>{selectedLead.contact.locationRequirements ?? "Not set"}</strong>
                    </div>
                    <div>
                      <p className="section-label">Timeline</p>
                      <strong>{selectedLead.contact.timeline ?? "Not set"}</strong>
                    </div>
                  </div>

                  <div className="helper-row">
                    <button className="button-secondary button-compact" type="button" onClick={() => handleGenerateAi("summary")}>
                      {aiLoadingKey === "summary" ? "Generating..." : "Summarize activity"}
                    </button>
                    <button className="button button-compact" type="button" onClick={() => handleGenerateAi("follow-up")}>
                      {aiLoadingKey === "follow-up" ? "Generating..." : "Draft follow-up"}
                    </button>
                  </div>
                  {aiError ? <p className="message message-error">{aiError}</p> : null}
                </div>
              </SystemPanel>
            ) : null}
          </section>

          <section className="dashboard-span-5">
            <SystemPanel label="Activity" title="Lead history" grid>
              {timelineItems.length > 0 ? <Timeline items={timelineItems} /> : <p>No activity logged yet.</p>}
            </SystemPanel>
          </section>

          <section className="dashboard-span-7">
            <SystemPanel label="Capture note" title="Add context for AI and follow-up">
              {selectedLead ? (
                <form className="section-stack compact-stack" onSubmit={handleAddActivity}>
                  <div className="field">
                    <label htmlFor="lead-activity">Note or conversation summary</label>
                    <textarea id="lead-activity" rows={5} value={activityDraft} onChange={(event) => setActivityDraft(event.target.value)} required />
                  </div>
                  {activityError ? <p className="message message-error">{activityError}</p> : null}
                  <div className="helper-row">
                    <button className="button" type="submit" disabled={activitySubmitting}>
                      {activitySubmitting ? "Saving..." : "Save activity"}
                    </button>
                  </div>
                </form>
              ) : (
                <p>Select a lead to add activity.</p>
              )}
            </SystemPanel>
          </section>

          <section className="dashboard-span-12">
            <SystemPanel label="AI lead summary" title="Reviewed intelligence only">
              {selectedLead ? (
                <div className="insight-grid ai-grid">
                  <article className="insight-card">
                    <p className="section-label">Qualification</p>
                    {leadQualification ? (
                      <>
                        <h3>{String((leadQualification.content.intent as string | undefined) ?? "Intent not available")}</h3>
                        <p>{String((leadQualification.content.qualificationSummary as string | undefined) ?? leadQualification.summary ?? "No summary available.")}</p>
                        <span className="table-meta">
                          Score {(leadQualification.content.leadScore as number | undefined) ?? selectedLead.score} - Confidence {Math.round((leadQualification.confidence ?? 0) * 100)}%
                        </span>
                        <div className="helper-row">
                          <button className="button-secondary button-compact" type="button" onClick={() => handleReviewArtifact(leadQualification.id, "approved")}>
                            Approve
                          </button>
                          <button className="button-secondary button-compact" type="button" onClick={() => handleReviewArtifact(leadQualification.id, "rejected")}>
                            Reject
                          </button>
                        </div>
                      </>
                    ) : (
                      <p>No AI qualification yet. Generate one from real lead context.</p>
                    )}
                  </article>

                  <article className="insight-card">
                    <p className="section-label">Activity summary</p>
                    {leadSummary ? (
                      <>
                        <h3>Context summary</h3>
                        <p>{String((leadSummary.content.summary as string | undefined) ?? leadSummary.summary ?? "No summary available.")}</p>
                        <span className="table-meta">Confidence {Math.round((leadSummary.confidence ?? 0) * 100)}%</span>
                        <div className="helper-row">
                          <button className="button-secondary button-compact" type="button" onClick={() => handleSaveDraft(leadSummary.id)}>
                            Save summary
                          </button>
                        </div>
                      </>
                    ) : (
                      <p>No AI summary yet. Add notes and generate a summary after real activity exists.</p>
                    )}
                  </article>

                  <article className="insight-card">
                    <p className="section-label">Follow-up draft</p>
                    {followUpDraft ? (
                      <>
                        <h3>{String((followUpDraft.content.channel as string | undefined) ?? "Draft")}</h3>
                        <div className="field">
                          <label htmlFor={`draft-${followUpDraft.id}`}>Draft message</label>
                          <textarea
                            id={`draft-${followUpDraft.id}`}
                            rows={6}
                            value={draftEdits[followUpDraft.id] ?? String((followUpDraft.content.message as string | undefined) ?? "No message generated.")}
                            onChange={(event) =>
                              setDraftEdits((current) => ({
                                ...current,
                                [followUpDraft.id]: event.target.value
                              }))
                            }
                          />
                        </div>
                        <span className="table-meta">Review before copy or send through a future communication channel.</span>
                        <div className="helper-row">
                          <button className="button-secondary button-compact" type="button" onClick={() => handleSaveDraft(followUpDraft.id)}>
                            Save draft
                          </button>
                          <button className="button-secondary button-compact" type="button" onClick={() => handleReviewArtifact(followUpDraft.id, "approved")}>
                            Approve draft
                          </button>
                          <button className="button-secondary button-compact" type="button" onClick={() => handleReviewArtifact(followUpDraft.id, "rejected")}>
                            Reject draft
                          </button>
                        </div>
                      </>
                    ) : (
                      <p>No follow-up draft yet. Generate one from stored lead and activity context.</p>
                    )}
                  </article>
                </div>
              ) : (
                <p>Select a lead to view AI outputs.</p>
              )}
            </SystemPanel>
          </section>
        </div>
      )}
    </div>
  );
}
