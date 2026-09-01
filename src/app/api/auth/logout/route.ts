import { handleSignOut } from "@/server/modules/auth/auth.controller";

export async function POST() {
  return handleSignOut();
}
