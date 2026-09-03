import { PropertiesWorkspace } from "@/components/properties/properties-workspace";
import { getSeededPropertyDetail, listSeededProperties } from "@/server/modules/properties/properties.service";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await listSeededProperties();
  const details = await Promise.all(properties.map((property) => getSeededPropertyDetail(property.id)));
  const detailsById = Object.fromEntries(
    details
      .filter((detail): detail is NonNullable<typeof detail> => detail != null)
      .map((detail) => [detail.property.id, detail])
  );

  return (
    <PropertiesWorkspace properties={properties} detailsById={detailsById} />
  );
}
