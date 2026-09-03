import { getDashboardSummary } from "@/server/modules/dashboard/dashboard.service";
import { fail, ok } from "@/server/shared/http";

export async function GET() {
  try {
    const data = await getDashboardSummary();
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
