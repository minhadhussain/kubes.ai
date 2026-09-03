import { getRealEstateDevData } from "@/server/dev-data/real-estate-dev-data";

export async function listSeededTransactions() {
  const dataset = getRealEstateDevData();

  return dataset.transactions.map((transaction) => ({
    ...transaction,
    property: dataset.properties.find((item) => item.id === transaction.propertyId) ?? null,
    listing: dataset.listings.find((item) => item.id === transaction.listingId) ?? null,
    buyer: dataset.contacts.find((item) => item.id === transaction.buyerContactId) ?? null,
    seller: dataset.contacts.find((item) => item.id === transaction.sellerContactId) ?? null,
    offer: transaction.offerId ? dataset.offers.find((item) => item.id === transaction.offerId) ?? null : null,
    tasks: dataset.transactionTasks.filter((item) => item.transactionId === transaction.id),
    documents: dataset.documents.filter((item) => item.transactionId === transaction.id)
  }));
}

export async function getSeededTransactionDetail(transactionId: string) {
  const dataset = getRealEstateDevData();
  const transaction = dataset.transactions.find((item) => item.id === transactionId);

  if (!transaction) {
    return null;
  }

  return {
    transaction,
    property: dataset.properties.find((item) => item.id === transaction.propertyId) ?? null,
    listing: dataset.listings.find((item) => item.id === transaction.listingId) ?? null,
    buyer: dataset.contacts.find((item) => item.id === transaction.buyerContactId) ?? null,
    seller: dataset.contacts.find((item) => item.id === transaction.sellerContactId) ?? null,
    offer: transaction.offerId ? dataset.offers.find((item) => item.id === transaction.offerId) ?? null : null,
    tasks: dataset.transactionTasks.filter((item) => item.transactionId === transaction.id),
    documents: dataset.documents.filter((item) => item.transactionId === transaction.id),
    activities: dataset.activities.filter((item) => item.entityType === "transaction" && item.entityId === transaction.id)
  };
}
