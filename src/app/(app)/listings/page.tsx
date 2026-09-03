import { ListingsWorkspace } from "@/components/listings/listings-workspace";
import { listSeededListings } from "@/server/modules/listings/listings.service";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const listings = await listSeededListings();

  return <ListingsWorkspace listings={listings} />;
}
