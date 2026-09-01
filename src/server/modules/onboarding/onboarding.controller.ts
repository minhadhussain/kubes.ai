import { NextRequest } from "next/server";

import { createOrganizationSchema } from "@/server/modules/onboarding/onboarding.validation";
import { createOrganization } from "@/server/modules/onboarding/onboarding.service";
import { fail, ok } from "@/server/shared/http";

export async function handleCreateOrganization(request: NextRequest) {
  try {
    const body = createOrganizationSchema.parse(await request.json());
    const organization = await createOrganization(body);
    return ok(organization, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
