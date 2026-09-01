import { NextResponse } from "next/server";

import { AppError, isAppError } from "@/server/shared/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(error: unknown) {
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
