import { getRealEstateDevData } from "@/server/dev-data/real-estate-dev-data";

export async function getSeededFinanceSummary() {
  const dataset = getRealEstateDevData();
  const expectedIncome = dataset.transactions.reduce((sum, transaction) => sum + transaction.commission, 0);
  const closingSoon = dataset.transactions.filter((transaction) => transaction.closingDate != null).slice(0, 6);

  return {
    expectedIncome,
    transactionCount: dataset.transactions.length,
    closingsSoon: closingSoon,
    averageCommission: dataset.transactions.length > 0 ? expectedIncome / dataset.transactions.length : 0
  };
}
