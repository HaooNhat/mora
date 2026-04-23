import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/app", "/dashboard", "/settings"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtectedRoute = PROTECTED_ROUTES.some((p) => pathname.startsWith(p));

  if (!isProtectedRoute) return NextResponse.next();

  const accessToken = req.cookies.get("access_token");
  const refreshToken = req.cookies.get("refresh_token");
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
