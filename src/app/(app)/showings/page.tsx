import { ShowingsWorkspace } from "@/components/showings/showings-workspace";
import { listSeededShowings } from "@/server/modules/showings/showings.service";

export const dynamic = "force-dynamic";

export default async function ShowingsPage() {
  const showings = await listSeededShowings();

  return <ShowingsWorkspace showings={showings} />;
}
