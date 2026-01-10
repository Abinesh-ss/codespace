import { NextRequest, NextResponse } from "next/server";

/**
 * Routes that do NOT require authentication
 */
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/pricing",
  "/",
];

/**
 * File extensions & internal paths to ignore
 */
const PUBLIC_FILES = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore next internals, static files, api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILES.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Read auth token (matches backend cookie name)
  const token = req.cookies.get("auth-token")?.value;

  // If no token → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Apply middleware only to app routes
 */
export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};

