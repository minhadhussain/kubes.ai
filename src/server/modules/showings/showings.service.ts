import { getRealEstateDevData } from "@/server/dev-data/real-estate-dev-data";

export async function listSeededShowings() {
  const dataset = getRealEstateDevData();

  return dataset.showings.map((showing) => ({
    ...showing,
    property: dataset.properties.find((item) => item.id === showing.propertyId) ?? null,
    listing: showing.listingId ? dataset.listings.find((item) => item.id === showing.listingId) ?? null : null,
    contact: dataset.contacts.find((item) => item.id === showing.contactId) ?? null
  }));
}

export async function getSeededShowingDetail(showingId: string) {
  const dataset = getRealEstateDevData();
  const showing = dataset.showings.find((item) => item.id === showingId);

  if (!showing) {
    return null;
  }

  const property = dataset.properties.find((item) => item.id === showing.propertyId) ?? null;
  const contact = dataset.contacts.find((item) => item.id === showing.contactId) ?? null;
  const listing = showing.listingId ? dataset.listings.find((item) => item.id === showing.listingId) ?? null : null;
  const relatedOffer = dataset.offers.find(
    (offer) => offer.propertyId === showing.propertyId && offer.buyerContactId === showing.contactId
  ) ?? null;

  return {
    showing,
    property,
    listing,
    contact,
    relatedOffer,
    transaction:
      relatedOffer == null ? null : dataset.transactions.find((item) => item.offerId === relatedOffer.id) ?? null
  };
}
