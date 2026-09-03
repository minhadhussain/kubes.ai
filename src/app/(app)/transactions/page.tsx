import { TransactionsWorkspace } from "@/components/transactions/transactions-workspace";
import { listSeededTransactions } from "@/server/modules/transactions/transactions.service";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const transactions = await listSeededTransactions();

  return <TransactionsWorkspace transactions={transactions} />;
}
