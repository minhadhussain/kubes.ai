import { getRealEstateDevData } from "@/server/dev-data/real-estate-dev-data";

export async function listSeededListings() {
  const dataset = getRealEstateDevData();

  return dataset.listings.map((listing) => {
    const property = dataset.properties.find((item) => item.id === listing.propertyId)!;
    const seller = dataset.contacts.find((item) => item.id === listing.sellerContactId) ?? null;
    const showings = dataset.showings.filter((item) => item.listingId === listing.id);
    const offers = dataset.offers.filter((item) => item.listingId === listing.id);

    return {
      ...listing,
      property,
      seller,
      showingCount: showings.length,
      offerCount: offers.length
    };
  });
}

export async function getSeededListingDetail(listingId: string) {
  const dataset = getRealEstateDevData();
  const listing = dataset.listings.find((item) => item.id === listingId);

  if (!listing) {
    return null;
  }

  return {
    listing,
    property: dataset.properties.find((item) => item.id === listing.propertyId) ?? null,
    seller: dataset.contacts.find((item) => item.id === listing.sellerContactId) ?? null,
    showings: dataset.showings.filter((item) => item.listingId === listing.id),
    offers: dataset.offers.filter((item) => item.listingId === listing.id),
    transaction: dataset.transactions.find((item) => item.listingId === listing.id) ?? null
  };
}
