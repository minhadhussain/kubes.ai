import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/server/shared/errors";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw new AppError("Unable to load current user.", 401, "AUTH_USER_ERROR");
  }

  return user;
});

export const requireCurrentUser = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
  }

  return user;
});
