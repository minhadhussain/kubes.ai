import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoutes = [
    "/dashboard",
    "/crm",
    "/leads",
    "/contacts",
    "/properties",
    "/listings",
    "/calendar",
    "/showings",
    "/tasks",
    "/transactions",
    "/documents",
    "/finance",
    "/analytics",
    "/client-portal",
    "/settings"
  ];

  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const sessionResponse = updateSession(request);

  if (!isProtectedRoute) {
    return sessionResponse;
  }

  const hasSupabaseSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

  if (hasSupabaseSession) {
    return sessionResponse;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname === "/dashboard" ? "/dashboard" : `${pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
