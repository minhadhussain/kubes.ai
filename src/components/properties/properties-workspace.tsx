"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { useCopilotPageContext } from "@/components/copilot/copilot-context";
import { DataTable } from "@/components/ui/data-table";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemPanel } from "@/components/ui/system-panel";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";

type PropertyRecord = {
  id: string;
  title: string;
  addressLine1: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  parkingSpaces: number;
  furnishing: string;
  amenities: string[];
  description: string;
  status: string;
  image: string;
  createdAt: string;
  listingCount: number;
  activeListingCount: number;
  latestListingStatus: string | null;
  latestListingPrice: number | null;
  latestListingPriceDisplay: string | null;
  currentMarketState: "on_market" | "off_market";
  showingCount: number;
  offerCount: number;
  transactionCount: number;
  latestListing: {
    id: string;
    status: string;
    listPrice: number;
    daysOnMarket: number;
    listingType: string;
    publishedAt: string | null;
    expiresAt: string | null;
  } | null;
};

type PropertyDetail = {
  property: {
    id: string;
    title: string;
    addressLine1: string;
    locality: string;
    city: string;
    state: string;
    propertyType: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    areaSqft: number;
    parkingSpaces: number;
    furnishing: string;
    amenities: string[];
    description: string;
    status: string;
    listingStatus: string;
    image: string;
    createdAt: string;
  };
  listings: Array<{
    id: string;
    status: string;
    listingType: string;
    listPrice: number;
    daysOnMarket: number;
    publishedAt: string | null;
    expiresAt: string | null;
    description: string;
    seller: { displayName: string } | null;
    showingCount: number;
    offerCount: number;
    transaction: { id: string; stage: string; closingDate: string | null } | null;
  }>;
  showings: Array<{
    id: string;
    status: string;
    startsAt: string;
    endsAt: string;
    notes: string | null;
    feedback: string | null;
    contact: { displayName: string } | null;
  }>;
  offers: Array<{
    id: string;
    status: string;
    offerPrice: number;
    buyer: { displayName: string } | null;
    seller: { displayName: string } | null;
  }>;
  transactions: Array<{
    id: string;
    stage: string;
    closingDate: string | null;
    salePrice: number;
    summary: string;
  }>;
  documents: Array<{
    id: string;
    fileName: string;
    category: string;
    status: string;
  }>;
  activities: Array<{
    id: string;
    title: string;
    body: string;
    occurredAt: string;
  }>;
};

type PropertiesWorkspaceProps = {
  properties: PropertyRecord[];
  detailsById: Record<string, PropertyDetail>;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function PropertiesWorkspace({ properties, detailsById }: PropertiesWorkspaceProps) {
  const { setPageContext } = useCopilotPageContext();
  const [search, setSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? null);

  const filteredProperties = useMemo(() => {
    const normalized = search.trim().toLowerCase();

      return properties.filter((property) => {
        const matchesSearch =
          normalized.length === 0 ||
          `${property.title} ${property.addressLine1} ${property.locality} ${property.city}`.toLowerCase().includes(normalized);
        const matchesFilter = marketFilter === "all" || property.currentMarketState === marketFilter;

        return matchesSearch && matchesFilter;
      });
  }, [marketFilter, properties, search]);

  const selectedProperty = filteredProperties.find((property) => property.id === selectedPropertyId) ?? properties.find((property) => property.id === selectedPropertyId) ?? null;
  const selectedDetail = selectedProperty ? detailsById[selectedProperty.id] : null;

  useEffect(() => {
    setPageContext({ entityType: selectedProperty ? "property" : null, entityId: selectedProperty?.id ?? null });
  }, [selectedProperty, setPageContext]);

  const metrics = useMemo(
    () => ({
      total: properties.length,
      onMarket: properties.filter((property) => property.currentMarketState === "on_market").length,
      withHistory: properties.filter((property) => property.listingCount > 0).length,
      liveShowings: properties.filter((property) => property.showingCount > 0).length,
      transacting: properties.filter((property) => property.transactionCount > 0).length
    }),
    [properties]
  );

  const timelineItems: TimelineItem[] = (selectedDetail?.activities ?? []).slice(0, 4).map((activity) => ({
    time: new Date(activity.occurredAt).toLocaleDateString(),
    title: activity.title,
    description: activity.body,
    tone: "accent"
  }));

  return (
    <div className="section-stack">
      <PageHeader
        label="Properties"
        title="Canonical property database"
        description="Manage the real-world assets in your database, then inspect each property's connected listing history, showings, offers, and transactions without merging those records together."
        meta={
          <div className="header-meta-grid">
            <div>
              <p className="section-label">Inventory</p>
              <strong>{properties.length} properties</strong>
            </div>
            <div>
              <p className="section-label">On market</p>
              <StatusBadge label={`${metrics.onMarket} properties with live listings`} tone="accent" />
            </div>
          </div>
        }
        actions={
          <>
            <input
              aria-label="Search properties"
              className="input-compact"
              placeholder="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="select-compact" value={marketFilter} onChange={(event) => setMarketFilter(event.target.value)}>
              <option value="all">All properties</option>
              <option value="on_market">On market</option>
              <option value="off_market">Off market</option>
            </select>
            <button className="button-secondary button-compact" type="button" onClick={() => setView((current) => (current === "grid" ? "list" : "grid"))}>
              {view === "grid" ? "List view" : "Grid view"}
            </button>
            <button className="button button-compact" type="button">+ Add Property</button>
          </>
        }
      />

      <div className="metrics-grid">
        <Metric label="Total properties" value={metrics.total} meta="Canonical asset records across your workspace" tone="accent" status="Live" />
        <Metric label="On market" value={metrics.onMarket} meta="Properties linked to active listings" />
        <Metric label="With listing history" value={metrics.withHistory} meta="Assets that have been listed at least once" />
        <Metric label="In workflow" value={metrics.transacting} meta="Properties already connected to transactions" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-span-7">
          <SystemPanel label="Inventory" title={view === "grid" ? "Property grid" : "Property list"}>
            {view === "grid" ? (
              <div className="property-grid">
                {filteredProperties.map((property) => (
                  <button
                    key={property.id}
                    type="button"
                    className={`property-card ${selectedPropertyId === property.id ? "property-card-active" : ""}`}
                    onClick={() => setSelectedPropertyId(property.id)}
                    >
                      <Image src={property.image} alt={property.title} className="property-card-image" width={900} height={600} />
                      <div className="property-card-body">
                        <div className="property-card-topline">
                          <StatusBadge
                            label={property.currentMarketState === "on_market" ? "On market" : "Off market"}
                            tone={property.currentMarketState === "on_market" ? "accent" : "neutral"}
                          />
                          <strong>{property.latestListingPriceDisplay ?? "No listing yet"}</strong>
                        </div>
                        <h3>{property.addressLine1}</h3>
                        <p>{property.locality}, {property.city}</p>
                        <div className="property-card-stats">
                          <span>{property.bedrooms} BHK</span>
                          <span>{property.bathrooms} Bath</span>
                          <span>{property.areaSqft.toLocaleString()} sq ft</span>
                          <span>{property.listingCount} listing{property.listingCount === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                    </button>
                ))}
              </div>
            ) : (
              <DataTable
                columns={[
                  {
                    key: "property",
                    header: "Property",
                    render: (row) => (
                      <button className="table-link-button" type="button" onClick={() => setSelectedPropertyId(row.id)}>
                        <strong>{row.addressLine1}</strong>
                      </button>
                    )
                  },
                  { key: "type", header: "Type", render: (row) => <span>{row.bedrooms} BHK {row.propertyType}</span> },
                  { key: "market", header: "Market state", render: (row) => <StatusBadge label={row.currentMarketState === "on_market" ? "On market" : "Off market"} tone={row.currentMarketState === "on_market" ? "accent" : "neutral"} /> },
                  { key: "history", header: "Listings", render: (row) => <span>{row.listingCount}</span> },
                  { key: "demand", header: "Workflow", render: (row) => <span>{row.showingCount} showings · {row.offerCount} offers</span> }
                ]}
                rows={filteredProperties}
              />
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-5">
          <SystemPanel label="Property detail" title={selectedProperty?.title ?? "Select a property"} grid>
            {selectedProperty && selectedDetail ? (
              <div className="section-stack compact-stack">
                <div className="detail-grid">
                  <div>
                    <p className="section-label">Address</p>
                    <strong>{selectedProperty.addressLine1}</strong>
                    <p className="table-meta">{selectedProperty.locality}, {selectedProperty.city}, {selectedProperty.state}</p>
                  </div>
                  <div>
                    <p className="section-label">Physical profile</p>
                    <strong>{selectedProperty.bedrooms} BHK · {selectedProperty.bathrooms} Bath</strong>
                    <p className="table-meta">{selectedProperty.areaSqft.toLocaleString()} sq ft · {selectedProperty.parkingSpaces} parking</p>
                  </div>
                  <div>
                    <p className="section-label">Asset details</p>
                    <strong>{selectedProperty.furnishing}</strong>
                    <p className="table-meta">{selectedProperty.amenities.slice(0, 2).join(" · ")}</p>
                  </div>
                  <div>
                    <p className="section-label">Market linkage</p>
                    <strong>{selectedProperty.listingCount} listing{selectedProperty.listingCount === 1 ? "" : "s"}</strong>
                    <p className="table-meta">{selectedProperty.latestListing ? `${selectedProperty.latestListing.status.replace(/_/g, " ")} · ${selectedProperty.latestListing.daysOnMarket} DOM` : "No listings created yet"}</p>
                  </div>
                </div>
                <p>{selectedProperty.description}</p>
              </div>
            ) : (
              <p>Select a property to view details.</p>
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-5">
          <SystemPanel label="Activity" title="Property activity" grid>
            {timelineItems.length > 0 ? <Timeline items={timelineItems} /> : <p>No property activity logged.</p>}
          </SystemPanel>
        </section>

        <section className="dashboard-span-7">
          <SystemPanel label="Related records" title="Listings, showings, offers, and transactions">
            {selectedDetail ? (
              <div className="insight-grid">
                <article className="insight-card">
                  <p className="section-label">Listings</p>
                  <h3>{selectedDetail.listings.length}</h3>
                  <p>{selectedDetail.listings[0] ? `${currency(selectedDetail.listings[0].listPrice)} · ${selectedDetail.listings[0].status.replace(/_/g, " ")}` : "No listing history yet."}</p>
                </article>
                <article className="insight-card">
                  <p className="section-label">Showings</p>
                  <h3>{selectedDetail.showings.length}</h3>
                  <p>{selectedDetail.showings[0]?.contact?.displayName ?? "No showings booked yet."}</p>
                </article>
                <article className="insight-card">
                  <p className="section-label">Offers / transactions</p>
                  <h3>{selectedDetail.offers.length} / {selectedDetail.transactions.length}</h3>
                  <p>{selectedDetail.transactions[0]?.closingDate ? `Latest close ${selectedDetail.transactions[0].closingDate}` : "No transaction history yet."}</p>
                </article>
              </div>
            ) : (
              <p>Select a property to inspect its connected workflow.</p>
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-12">
          <SystemPanel label="Detail surfaces" title="Property source of truth with connected listing history">
            {selectedDetail ? (
              <div className="dashboard-grid property-detail-grid">
                <div className="dashboard-span-5">
                  <Image src={selectedProperty?.image ?? "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80"} alt={selectedProperty?.title ?? "Property"} className="property-detail-image" width={900} height={700} />
                </div>
                <div className="dashboard-span-7 section-stack compact-stack">
                  <div className="detail-grid">
                    <div>
                      <p className="section-label">Listing history</p>
                      <strong>{selectedDetail.listings.length}</strong>
                    </div>
                    <div>
                      <p className="section-label">Showings</p>
                      <strong>{selectedDetail.showings.length}</strong>
                    </div>
                    <div>
                      <p className="section-label">Offers</p>
                      <strong>{selectedDetail.offers.length}</strong>
                    </div>
                    <div>
                      <p className="section-label">Transactions</p>
                      <strong>{selectedDetail.transactions[0]?.stage.replace(/_/g, " ") ?? "Not active"}</strong>
                    </div>
                  </div>
                  <div className="insight-grid property-mini-grid">
                    {selectedDetail.listings.slice(0, 2).map((listing) => (
                      <article key={listing.id} className="insight-card">
                        <p className="section-label">Listing</p>
                        <h3>{currency(listing.listPrice)}</h3>
                        <p>{listing.status.replace(/_/g, " ")} · {listing.daysOnMarket} DOM</p>
                      </article>
                    ))}
                    {selectedDetail.showings.slice(0, 2).map((showing) => (
                      <article key={showing.id} className="insight-card">
                        <p className="section-label">Showing</p>
                        <h3>{showing.contact?.displayName ?? "Client"}</h3>
                        <p>{new Date(showing.startsAt).toLocaleString()}</p>
                      </article>
                    ))}
                    {selectedDetail.offers.slice(0, 2).map((offer) => (
                      <article key={offer.id} className="insight-card">
                        <p className="section-label">Offer</p>
                        <h3>{currency(offer.offerPrice)}</h3>
                        <p>{offer.buyer?.displayName ?? "Buyer"} · {offer.status}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p>Select a property to review its complete operating context.</p>
            )}
          </SystemPanel>
        </section>
      </div>
    </div>
  );
}
