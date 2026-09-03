"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useCopilotPageContext } from "@/components/copilot/copilot-context";
import { DataTable } from "@/components/ui/data-table";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";

type ContactListItem = {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  contact_types: string[];
  lead_source: string | null;
  budget: number | null;
  timeline: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  updated_at: string;
};

type ContactDetail = {
  contact: {
    id: string;
    display_name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    contact_types: string[];
    lead_source: string | null;
    budget: number | null;
    location_requirements: string | null;
    timeline: string | null;
    last_contacted_at: string | null;
    next_follow_up_at: string | null;
    updated_at: string;
  };
  leads: Array<{
    id: string;
    stage: string;
    disposition: string;
    score: number;
    source: string | null;
    next_follow_up_at: string | null;
    created_at: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    due_at: string | null;
  }>;
  activities: Array<{
    id: string;
    title: string;
    body: string | null;
    activity_type: string;
    occurred_at: string;
  }>;
  showings: Array<{
    id: string;
    status: string;
    starts_at: string;
    property: { address_line_1: string; city: string } | null;
  }>;
  transactions: Array<{
    id: string;
    stage: string;
    closing_date: string | null;
    sale_price: number | null;
  }>;
  properties: Array<{
    id: string;
    status: string;
    property: { id: string; address_line_1: string; city: string; price: number | null } | null;
  }>;
};

type ContactsWorkspaceProps = {
  initialContacts: ContactListItem[];
};

const emptyContactForm = {
  displayName: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  country: "",
  leadSource: "",
  budget: "",
  timeline: "",
  locationRequirements: "",
  contactTypes: ["lead"] as string[]
};

export function ContactsWorkspace({ initialContacts }: ContactsWorkspaceProps) {
  const { setPageContext } = useCopilotPageContext();
  const [contacts, setContacts] = useState(initialContacts);
  const [selectedContactId, setSelectedContactId] = useState(initialContacts[0]?.id ?? null);
  const [selectedContact, setSelectedContact] = useState<ContactDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("updated_desc");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyContactForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activityForm, setActivityForm] = useState({ title: "", body: "", activityType: "note" });
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activitySubmitting, setActivitySubmitting] = useState(false);

  const filteredContacts = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesSearch =
        normalized.length === 0 ||
        contact.display_name.toLowerCase().includes(normalized) ||
        contact.email?.toLowerCase().includes(normalized) ||
        contact.phone?.toLowerCase().includes(normalized);

      const matchesType = typeFilter === "all" || contact.contact_types.includes(typeFilter);

      return matchesSearch && matchesType;
    });
  }, [contacts, search, typeFilter]);

  useEffect(() => {
    setPageContext({ entityType: selectedContact?.contact.id ? "contact" : null, entityId: selectedContact?.contact.id ?? null });
  }, [selectedContact, setPageContext]);

  useEffect(() => {
    if (!selectedContactId) {
      return;
    }

    let ignore = false;

    async function loadDetail() {
      setLoadingDetail(true);
      setDetailError(null);

      try {
        const response = await fetch(`/api/contacts/${selectedContactId}`, { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message ?? "Unable to load contact detail.");
        }

        if (!ignore) {
          setSelectedContact(result.data);
        }
      } catch (error) {
        if (!ignore) {
          setDetailError(error instanceof Error ? error.message : "Unable to load contact detail.");
        }
      } finally {
        if (!ignore) {
          setLoadingDetail(false);
        }
      }
    }

    void loadDetail();

    return () => {
      ignore = true;
    };
  }, [selectedContactId]);

  async function refreshContacts(preferredContactId?: string) {
    const params = new URLSearchParams();
    if (search) {
      params.set("q", search);
    }
    if (typeFilter !== "all") {
      params.set("type", typeFilter);
    }
    params.set("sort", sort);

    const response = await fetch(`/api/contacts?${params.toString()}`, { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message ?? "Unable to reload contacts.");
    }

    setContacts(result.data);
    setSelectedContactId(preferredContactId ?? result.data[0]?.id ?? null);
  }

  async function handleCreateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: form.budget ? Number(form.budget) : undefined
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to create contact.");
      }

      setForm(emptyContactForm);
      setCreating(false);
      await refreshContacts(result.data.contactId);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create contact.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedContact) {
      return;
    }

    setActivitySubmitting(true);
    setActivityError(null);

    try {
      const response = await fetch(`/api/contacts/${selectedContact.contact.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityForm)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Unable to save activity.");
      }

      setActivityForm({ title: "", body: "", activityType: "note" });
      setSelectedContactId(selectedContact.contact.id);
    } catch (error) {
      setActivityError(error instanceof Error ? error.message : "Unable to save activity.");
    } finally {
      setActivitySubmitting(false);
    }
  }

  const metrics = useMemo(() => {
    return {
      total: contacts.length,
      buyers: contacts.filter((contact) => contact.contact_types.includes("buyer")).length,
      sellers: contacts.filter((contact) => contact.contact_types.includes("seller")).length,
      followUps: contacts.filter((contact) => Boolean(contact.next_follow_up_at)).length
    };
  }, [contacts]);

  const timelineItems: TimelineItem[] = (selectedContact?.activities ?? []).slice(0, 6).map((activity) => ({
    time: new Date(activity.occurred_at).toLocaleDateString(),
    title: activity.title,
    description: activity.body ?? "No details recorded.",
    tone: activity.activity_type === "note" ? "neutral" : "accent"
  }));

  return (
    <div className="section-stack">
      <PageHeader
        label="Contacts"
        title="Real contact directory"
        description="Manage real client, lead, seller, vendor, and partner records with connected activities, tasks, and pipeline relationships."
        meta={
          <div className="header-meta-grid">
            <div>
              <p className="section-label">Directory</p>
              <strong>{metrics.total} contacts</strong>
            </div>
            <div>
              <p className="section-label">Follow-ups</p>
              <StatusBadge label={`${metrics.followUps} scheduled`} tone={metrics.followUps > 0 ? "warning" : "neutral"} />
            </div>
          </div>
        }
        actions={
          <button className="button button-compact" type="button" onClick={() => setCreating((current) => !current)}>
            {creating ? "Close form" : "Add contact"}
          </button>
        }
      />

      <div className="metrics-grid">
        <Metric label="All contacts" value={metrics.total} meta="Live directory records" tone="accent" status="Live" />
        <Metric label="Buyers" value={metrics.buyers} meta="Contacts with buyer intent" />
        <Metric label="Sellers" value={metrics.sellers} meta="Contacts with seller activity" />
        <Metric label="Scheduled follow-ups" value={metrics.followUps} meta="Contacts with a next-touch date" />
      </div>

      {creating ? (
        <SystemPanel label="Create contact" title="Add a real contact">
          <form className="section-stack" onSubmit={handleCreateContact}>
            <div className="form-grid-two">
              <div className="field">
                <label htmlFor="contact-name">Display name</label>
                <input id="contact-name" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required />
              </div>
              <div className="field">
                <label htmlFor="contact-email">Email</label>
                <input id="contact-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="contact-phone">Phone</label>
                <input id="contact-phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="contact-source">Lead source</label>
                <input id="contact-source" value={form.leadSource} onChange={(event) => setForm((current) => ({ ...current, leadSource: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="contact-budget">Budget</label>
                <input id="contact-budget" type="number" value={form.budget} onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="contact-timeline">Timeline</label>
                <input id="contact-timeline" value={form.timeline} onChange={(event) => setForm((current) => ({ ...current, timeline: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="contact-city">City</label>
                <input id="contact-city" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="contact-state">State</label>
                <input id="contact-state" value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="contact-location">Location requirements</label>
              <input id="contact-location" value={form.locationRequirements} onChange={(event) => setForm((current) => ({ ...current, locationRequirements: event.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="contact-types">Contact types (comma separated)</label>
              <input
                id="contact-types"
                value={form.contactTypes.join(", ")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    contactTypes: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                  }))
                }
              />
            </div>
            {formError ? <p className="message message-error">{formError}</p> : null}
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create contact"}
            </button>
          </form>
        </SystemPanel>
      ) : null}

      <div className="dashboard-grid">
        <section className="dashboard-span-7">
          <SystemPanel label="Directory" title="Search and review contacts">
            <div className="toolbar-row">
              <div className="field">
                <label htmlFor="contact-search">Search</label>
                <input id="contact-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, phone" />
              </div>
              <div className="field">
                <label htmlFor="contact-type-filter">Type</label>
                <select id="contact-type-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="lead">Lead</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="vendor">Vendor</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="contact-sort">Sort</label>
                <select id="contact-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="updated_desc">Recently updated</option>
                  <option value="name_asc">Name</option>
                  <option value="last_contact_desc">Last contact</option>
                </select>
              </div>
            </div>

            {filteredContacts.length === 0 ? (
              <p>No contacts match the current filter.</p>
            ) : (
              <DataTable
                columns={[
                  {
                    key: "name",
                    header: "Name",
                    render: (row) => (
                      <button className="table-link-button" type="button" onClick={() => setSelectedContactId(row.id)}>
                        <strong>{row.display_name}</strong>
                      </button>
                    )
                  },
                  {
                    key: "type",
                    header: "Type",
                    render: (row) => <span className="table-meta">{row.contact_types.join(", ")}</span>
                  },
                  {
                    key: "email",
                    header: "Email",
                    render: (row) => <span>{row.email ?? "-"}</span>
                  },
                  {
                    key: "phone",
                    header: "Phone",
                    render: (row) => <span>{row.phone ?? "-"}</span>
                  },
                  {
                    key: "next",
                    header: "Next action",
                    render: (row) => <span>{row.next_follow_up_at ? new Date(row.next_follow_up_at).toLocaleString() : "None scheduled"}</span>
                  }
                ]}
                rows={filteredContacts}
              />
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-5">
          <SystemPanel label="Contact detail" title={selectedContact?.contact.display_name ?? "Select a contact"} grid>
            {loadingDetail ? (
              <p>Loading contact details...</p>
            ) : detailError ? (
              <p className="message message-error">{detailError}</p>
            ) : selectedContact ? (
              <div className="section-stack compact-stack">
                <div className="detail-grid">
                  <div>
                    <p className="section-label">Email</p>
                    <strong>{selectedContact.contact.email ?? "Not set"}</strong>
                  </div>
                  <div>
                    <p className="section-label">Phone</p>
                    <strong>{selectedContact.contact.phone ?? "Not set"}</strong>
                  </div>
                  <div>
                    <p className="section-label">Last contact</p>
                    <strong>{selectedContact.contact.last_contacted_at ? new Date(selectedContact.contact.last_contacted_at).toLocaleDateString() : "Unknown"}</strong>
                  </div>
                  <div>
                    <p className="section-label">Next follow-up</p>
                    <strong>{selectedContact.contact.next_follow_up_at ? new Date(selectedContact.contact.next_follow_up_at).toLocaleDateString() : "None"}</strong>
                  </div>
                </div>
                <p className="table-meta">Types: {selectedContact.contact.contact_types.join(", ")}</p>
              </div>
            ) : (
              <p>Select a contact to view details.</p>
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-5">
          <SystemPanel label="Activity timeline" title="Recent interactions" grid>
            {selectedContact ? (
              timelineItems.length > 0 ? <Timeline items={timelineItems} /> : <p>No activity yet.</p>
            ) : (
              <p>Select a contact to view activity.</p>
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-7">
          <SystemPanel label="Add activity" title="Log contact context">
            {selectedContact ? (
              <form className="section-stack compact-stack" onSubmit={handleCreateActivity}>
                <div className="field">
                  <label htmlFor="activity-title">Title</label>
                  <input id="activity-title" value={activityForm.title} onChange={(event) => setActivityForm((current) => ({ ...current, title: event.target.value }))} required />
                </div>
                <div className="field">
                  <label htmlFor="activity-body">Details</label>
                  <textarea id="activity-body" rows={4} value={activityForm.body} onChange={(event) => setActivityForm((current) => ({ ...current, body: event.target.value }))} required />
                </div>
                {activityError ? <p className="message message-error">{activityError}</p> : null}
                <button className="button" type="submit" disabled={activitySubmitting}>
                  {activitySubmitting ? "Saving..." : "Save activity"}
                </button>
              </form>
            ) : (
              <p>Select a contact to log activity.</p>
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-12">
          <SystemPanel label="Connected records" title="Leads, tasks, properties, showings, and transactions">
            {selectedContact ? (
              <div className="insight-grid">
                <article className="insight-card">
                  <p className="section-label">Leads</p>
                  <h3>{selectedContact.leads.length} linked</h3>
                  <p>{selectedContact.leads[0] ? `Latest stage: ${selectedContact.leads[0].stage}` : "No linked leads yet."}</p>
                </article>
                <article className="insight-card">
                  <p className="section-label">Tasks</p>
                  <h3>{selectedContact.tasks.length} linked</h3>
                  <p>{selectedContact.tasks[0]?.title ?? "No contact tasks yet."}</p>
                </article>
                <article className="insight-card">
                  <p className="section-label">Showings</p>
                  <h3>{selectedContact.showings.length} linked</h3>
                  <p>{selectedContact.showings[0]?.property ? `${selectedContact.showings[0].property.address_line_1}, ${selectedContact.showings[0].property.city}` : "No showings yet."}</p>
                </article>
              </div>
            ) : (
              <p>Select a contact to inspect linked records.</p>
            )}
          </SystemPanel>
        </section>
      </div>
    </div>
  );
}
