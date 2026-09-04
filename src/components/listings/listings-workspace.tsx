"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { useCopilotPageContext } from "@/components/copilot/copilot-context";
import { DataTable } from "@/components/ui/data-table";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";

type ListingRecord = {
  id: string;
  status: string;
  listingType: string;
  listPrice: number;
  daysOnMarket: number;
  publishedAt: string | null;
  expiresAt: string | null;
  description: string;
  property: {
    id: string;
    title: string;
    addressLine1: string;
    locality: string;
    city: string;
    image: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    areaSqft: number;
  };
  seller: {
    id: string;
    displayName: string;
  } | null;
  showingCount: number;
  offerCount: number;
};

type ListingsWorkspaceProps = {
  listings: ListingRecord[];
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function ListingsWorkspace({ listings }: ListingsWorkspaceProps) {
  const { setPageContext } = useCopilotPageContext();
  const [selectedId, setSelectedId] = useState(listings[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () => listings.filter((listing) => statusFilter === "all" || listing.status === statusFilter),
    [listings, statusFilter]
  );

  const selected = filtered.find((listing) => listing.id === selectedId) ?? listings.find((listing) => listing.id === selectedId) ?? null;
  useEffect(() => {
    setPageContext({ entityType: selected ? "listing" : null, entityId: selected?.id ?? null });
  }, [selected, setPageContext]);

  return (
    <div className="section-stack">
      <PageHeader
        label="Listings"
        title="Market records linked to properties"
        description="Track sale and rent listings as time-based market records attached to properties, with status, pricing, demand, and seller-side execution separated from the asset itself."
        meta={
          <div className="header-meta-grid">
            <div>
              <p className="section-label">Marketed</p>
              <strong>{listings.length} listings</strong>
            </div>
            <div>
              <p className="section-label">Active</p>
              <StatusBadge label={`${listings.filter((listing) => listing.status === "active").length} live`} tone="accent" />
            </div>
          </div>
        }
        actions={
          <>
            <select className="select-compact" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="coming_soon">Coming soon</option>
              <option value="active">Active</option>
              <option value="under_contract">Under contract</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="expired">Expired</option>
            </select>
            <button className="button button-compact" type="button">+ Create Listing</button>
          </>
        }
      />

      <div className="metrics-grid">
        <Metric label="Active" value={listings.filter((listing) => listing.status === "active").length} meta="Currently visible on market" tone="accent" status="Live" />
        <Metric label="Pending" value={listings.filter((listing) => listing.status === "pending").length} meta="Awaiting close movement" />
        <Metric label="Under contract" value={listings.filter((listing) => listing.status === "under_contract").length} meta="Negotiation phase inventory" />
        <Metric label="Offers" value={listings.reduce((sum, listing) => sum + listing.offerCount, 0)} meta="Active offer volume across listings" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-span-12">
          <SystemPanel label="Listing board" title="Connected property listings">
            <DataTable
              columns={[
                {
                  key: "property",
                  header: "Property",
                  render: (row) => (
                    <button className="table-link-button" type="button" onClick={() => setSelectedId(row.id)}>
                      <strong>{row.property.addressLine1}</strong>
                    </button>
                  )
                },
                { key: "type", header: "Type", render: (row) => <span>{row.listingType}</span> },
                { key: "price", header: "Price", render: (row) => <span>{currency(row.listPrice)}</span> },
                { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status.replace(/_/g, " ")} tone={row.status === "active" ? "accent" : row.status === "pending" || row.status === "under_contract" ? "warning" : "neutral"} /> },
                { key: "dom", header: "Days on market", render: (row) => <span>{row.daysOnMarket}</span> },
                { key: "demand", header: "Showings / offers", render: (row) => <span>{row.showingCount} / {row.offerCount}</span> }
              ]}
              rows={filtered}
            />
          </SystemPanel>
        </section>

        <section className="dashboard-span-12">
          <SystemPanel label="Listing detail" title={selected?.property.title ?? "Select a listing"} grid>
            {selected ? (
              <div className="section-stack compact-stack">
                <Image src={selected.property.image} alt={selected.property.title} className="property-detail-image" width={900} height={700} />
                <div className="detail-grid">
                  <div>
                    <p className="section-label">Property reference</p>
                    <strong>{selected.property.addressLine1}</strong>
                    <p className="table-meta">{selected.property.locality}, {selected.property.city}</p>
                  </div>
                  <div>
                    <p className="section-label">Listing terms</p>
                    <strong>{currency(selected.listPrice)}</strong>
                    <p className="table-meta">{selected.listingType} · {selected.status.replace(/_/g, " ")} · {selected.daysOnMarket} DOM</p>
                  </div>
                  <div>
                    <p className="section-label">Listing dates</p>
                    <strong>{selected.publishedAt ? new Date(selected.publishedAt).toLocaleDateString() : "Not published"}</strong>
                    <p className="table-meta">{selected.expiresAt ? `Expires ${new Date(selected.expiresAt).toLocaleDateString()}` : "No expiry set"}</p>
                  </div>
                  <div>
                    <p className="section-label">Seller / demand</p>
                    <strong>{selected.seller?.displayName ?? "Unassigned"}</strong>
                    <p className="table-meta">{selected.showingCount} showings · {selected.offerCount} offers</p>
                  </div>
                </div>
                <p>{selected.description}</p>
                <div className="detail-grid">
                  <div>
                    <p className="section-label">Underlying property</p>
                    <strong>{selected.property.propertyType}</strong>
                    <p className="table-meta">{selected.property.bedrooms} BHK · {selected.property.bathrooms} Bath · {selected.property.areaSqft.toLocaleString()} sq ft</p>
                  </div>
                </div>
              </div>
            ) : (
              <p>Select a listing to review detail.</p>
            )}
          </SystemPanel>
        </section>
      </div>
    </div>
  );
}
