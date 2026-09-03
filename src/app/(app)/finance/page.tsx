import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { getSeededFinanceSummary } from "@/server/modules/finance/finance.service";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const summary = await getSeededFinanceSummary();

  return <FinanceWorkspace summary={summary} />;
}
