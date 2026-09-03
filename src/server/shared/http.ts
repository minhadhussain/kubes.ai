import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, isAppError } from "@/server/shared/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    const issue = error.issues[0];

    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: issue?.message ?? "Request validation failed."
        }
      },
      { status: 400 }
    );
  }

  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message
        }
      },
      { status: error.statusCode }
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong. Please try again."
      }
    },
    { status: 500 }
  );
}

export function requireValue<T>(value: T | null | undefined, message: string, code = "NOT_FOUND") {
  if (value == null) {
    throw new AppError(message, 404, code);
  }

  return value;
}
