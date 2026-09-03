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
  propertyType: string;
  price: number;
  displayPrice: string;
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
  showingCount: number;
  offerCount: number;
  listing: {
    id: string;
    status: string;
    listPrice: number;
    daysOnMarket: number;
  } | null;
  transaction: {
    id: string;
    stage: string;
    closingDate: string | null;
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
  listing: {
    id: string;
    status: string;
    listingType: string;
    listPrice: number;
    daysOnMarket: number;
    publishedAt: string | null;
    expiresAt: string | null;
    description: string;
  } | null;
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
  transaction:
    | {
        id: string;
        stage: string;
        closingDate: string | null;
        salePrice: number;
        summary: string;
      }
    | null;
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
  const [listingFilter, setListingFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? null);

  const filteredProperties = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return properties.filter((property) => {
      const matchesSearch =
        normalized.length === 0 ||
        `${property.title} ${property.addressLine1} ${property.locality} ${property.city}`.toLowerCase().includes(normalized);
      const matchesFilter = listingFilter === "all" || property.listingStatus === listingFilter;

      return matchesSearch && matchesFilter;
    });
  }, [listingFilter, properties, search]);

  const selectedProperty = filteredProperties.find((property) => property.id === selectedPropertyId) ?? properties.find((property) => property.id === selectedPropertyId) ?? null;
  const selectedDetail = selectedProperty ? detailsById[selectedProperty.id] : null;

  useEffect(() => {
    setPageContext({ entityType: selectedProperty ? "property" : null, entityId: selectedProperty?.id ?? null });
  }, [selectedProperty, setPageContext]);

  const metrics = useMemo(
    () => ({
      total: properties.length,
      activeListings: properties.filter((property) => property.listingStatus === "active").length,
      underCr: properties.filter((property) => property.price < 10000000).length,
      liveShowings: properties.filter((property) => property.showingCount > 0).length
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
        title="Manage your property database."
        description="Track inventory, listing readiness, showings, offers, and transaction movement from one connected property workspace."
        meta={
          <div className="header-meta-grid">
            <div>
              <p className="section-label">Inventory</p>
              <strong>{properties.length} properties</strong>
            </div>
            <div>
              <p className="section-label">Market pulse</p>
              <StatusBadge label={`${metrics.activeListings} active listings`} tone="accent" />
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
            <select className="select-compact" value={listingFilter} onChange={(event) => setListingFilter(event.target.value)}>
              <option value="all">Filters</option>
              <option value="active">Active</option>
              <option value="coming_soon">Coming soon</option>
              <option value="pending">Pending</option>
              <option value="under_contract">Under contract</option>
              <option value="unlisted">Unlisted</option>
            </select>
            <button className="button-secondary button-compact" type="button" onClick={() => setView((current) => (current === "grid" ? "list" : "grid"))}>
              {view === "grid" ? "List view" : "Grid view"}
            </button>
            <button className="button button-compact" type="button">+ Add Property</button>
          </>
        }
      />

      <div className="metrics-grid">
        <Metric label="Total properties" value={metrics.total} meta="Realistic seeded inventory across active localities" tone="accent" status="Live" />
        <Metric label="Active listings" value={metrics.activeListings} meta="Properties currently marketed" />
        <Metric label="Under ₹1Cr" value={metrics.underCr} meta="Budget-aligned inventory for value buyers" />
        <Metric label="With showings" value={metrics.liveShowings} meta="Properties already drawing demand" />
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
                          label={property.listingStatus === "unlisted" ? "Unlisted" : property.listingStatus.replace(/_/g, " ")}
                          tone={property.listingStatus === "active" ? "accent" : property.listingStatus === "pending" || property.listingStatus === "under_contract" ? "warning" : "neutral"}
                        />
                        <strong>{property.displayPrice}</strong>
                      </div>
                      <h3>{property.addressLine1}</h3>
                      <p>{property.locality}, {property.city}</p>
                      <div className="property-card-stats">
                        <span>{property.bedrooms} BHK</span>
                        <span>{property.bathrooms} Bath</span>
                        <span>{property.areaSqft.toLocaleString()} sq ft</span>
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
                  { key: "price", header: "Price", render: (row) => <span>{row.displayPrice}</span> },
                  { key: "type", header: "Type", render: (row) => <span>{row.bedrooms} BHK {row.propertyType}</span> },
                  { key: "listing", header: "Listing", render: (row) => <StatusBadge label={row.listingStatus} tone={row.listingStatus === "active" ? "accent" : "neutral"} /> },
                  { key: "demand", header: "Demand", render: (row) => <span>{row.showingCount} showings · {row.offerCount} offers</span> }
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
                    <p className="section-label">Overview</p>
                    <strong>{selectedProperty.displayPrice}</strong>
                    <p className="table-meta">{selectedProperty.addressLine1}, {selectedProperty.locality}</p>
                  </div>
                  <div>
                    <p className="section-label">Property information</p>
                    <strong>{selectedProperty.bedrooms} BHK · {selectedProperty.bathrooms} Bath</strong>
                    <p className="table-meta">{selectedProperty.areaSqft.toLocaleString()} sq ft · {selectedProperty.parkingSpaces} parking</p>
                  </div>
                  <div>
                    <p className="section-label">Features</p>
                    <strong>{selectedProperty.furnishing}</strong>
                    <p className="table-meta">{selectedProperty.amenities.slice(0, 2).join(" · ")}</p>
                  </div>
                  <div>
                    <p className="section-label">Listing information</p>
                    <strong>{selectedProperty.listingStatus === "unlisted" ? "Not on market" : selectedProperty.listingStatus.replace(/_/g, " ")}</strong>
                    <p className="table-meta">{selectedDetail.listing ? `${selectedDetail.listing.daysOnMarket} DOM` : "Ready for listing creation"}</p>
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
          <SystemPanel label="Connected workflow" title="Showings, offers, transactions, and media">
            {selectedDetail ? (
              <div className="insight-grid">
                <article className="insight-card">
                  <p className="section-label">Showings</p>
                  <h3>{selectedDetail.showings.length}</h3>
                  <p>{selectedDetail.showings[0]?.contact?.displayName ?? "No showings booked yet."}</p>
                </article>
                <article className="insight-card">
                  <p className="section-label">Offers</p>
                  <h3>{selectedDetail.offers.length}</h3>
                  <p>{selectedDetail.offers[0] ? `${currency(selectedDetail.offers[0].offerPrice)} · ${selectedDetail.offers[0].status}` : "No offers submitted yet."}</p>
                </article>
                <article className="insight-card">
                  <p className="section-label">Transactions</p>
                  <h3>{selectedDetail.transaction ? selectedDetail.transaction.stage.replace(/_/g, " ") : "None"}</h3>
                  <p>{selectedDetail.transaction?.closingDate ? `Closing ${selectedDetail.transaction.closingDate}` : "No active transaction."}</p>
                </article>
              </div>
            ) : (
              <p>Select a property to inspect its connected workflow.</p>
            )}
          </SystemPanel>
        </section>

        <section className="dashboard-span-12">
          <SystemPanel label="Detail surfaces" title="Media, showings, offers, transaction, and activity">
            {selectedDetail ? (
              <div className="dashboard-grid property-detail-grid">
                <div className="dashboard-span-5">
                  <Image src={selectedProperty?.image ?? "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80"} alt={selectedProperty?.title ?? "Property"} className="property-detail-image" width={900} height={700} />
                </div>
                <div className="dashboard-span-7 section-stack compact-stack">
                  <div className="detail-grid">
                    <div>
                      <p className="section-label">Showings</p>
                      <strong>{selectedDetail.showings.length}</strong>
                    </div>
                    <div>
                      <p className="section-label">Offers</p>
                      <strong>{selectedDetail.offers.length}</strong>
                    </div>
                    <div>
                      <p className="section-label">Documents</p>
                      <strong>{selectedDetail.documents.length}</strong>
                    </div>
                    <div>
                      <p className="section-label">Transaction</p>
                      <strong>{selectedDetail.transaction?.stage.replace(/_/g, " ") ?? "Not active"}</strong>
                    </div>
                  </div>
                  <div className="insight-grid property-mini-grid">
                    {selectedDetail.showings.slice(0, 3).map((showing) => (
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
