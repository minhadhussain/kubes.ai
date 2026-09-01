import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required."),
  workspaceType: z.enum(["solo", "team", "brokerage"])
});
