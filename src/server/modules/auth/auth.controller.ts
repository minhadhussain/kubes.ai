import { NextRequest } from "next/server";

import {
  resetPasswordSchema,
  signInSchema,
  signUpSchema
} from "@/server/modules/auth/auth.validation";
import {
  sendPasswordResetEmail,
  signInWithPassword,
  signOutCurrentUser,
  signUpWithPassword
} from "@/server/modules/auth/auth.service";
import { fail, ok } from "@/server/shared/http";

export async function handleSignUp(request: NextRequest) {
  try {
    const body = signUpSchema.parse(await request.json());
    const result = await signUpWithPassword(body);
    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function handleSignIn(request: NextRequest) {
  try {
    const body = signInSchema.parse(await request.json());
    const result = await signInWithPassword(body);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function handleSignOut() {
  try {
    await signOutCurrentUser();
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

export async function handlePasswordReset(request: NextRequest) {
  try {
    const body = resetPasswordSchema.parse(await request.json());
    await sendPasswordResetEmail(body.email);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
