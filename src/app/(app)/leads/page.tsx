import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import { listLeads } from "@/server/modules/leads/leads.service";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await listLeads();

  return <LeadsWorkspace initialLeads={leads} />;
}
