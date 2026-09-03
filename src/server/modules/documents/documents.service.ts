import { getRealEstateDevData } from "@/server/dev-data/real-estate-dev-data";

export async function listSeededDocuments() {
  const dataset = getRealEstateDevData();

  return dataset.documents.map((document) => ({
    ...document,
    property: document.propertyId ? dataset.properties.find((item) => item.id === document.propertyId) ?? null : null,
    contact: document.contactId ? dataset.contacts.find((item) => item.id === document.contactId) ?? null : null,
    transaction: document.transactionId ? dataset.transactions.find((item) => item.id === document.transactionId) ?? null : null
  }));
}
