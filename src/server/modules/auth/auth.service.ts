import { requirePublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/server/shared/errors";

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  fullName: string;
}) {
  const publicEnv = requirePublicEnv();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName
      },
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  });

  if (error) {
    throw new AppError(error.message, 400, "SIGN_UP_FAILED");
  }

  return data;
}

export async function signInWithPassword(input: { email: string; password: string }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  return data;
}

export async function signOutCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AppError("Unable to sign out.", 400, "SIGN_OUT_FAILED");
  }
}

export async function sendPasswordResetEmail(email: string) {
  const publicEnv = requirePublicEnv();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`
  });

  if (error) {
    throw new AppError(error.message, 400, "PASSWORD_RESET_FAILED");
  }
}
