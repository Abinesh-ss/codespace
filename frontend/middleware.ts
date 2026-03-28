import { NextRequest, NextResponse } from "next/server";

/**
 * Paths that anyone can see
 */
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/pricing",
  "/",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip middleware for internal Next.js tasks and static files
  // Optimized to avoid complex regex which can sometimes trigger EvalErrors
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Simple check for files like .png, .css, .js
  ) {
    return NextResponse.next();
  }

  // 2. If the user is on a public path, let them through
  if (PUBLIC_PATHS.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  // 3. Check for the authentication cookie
  const token = req.cookies.get("auth-token")?.value;

  // 4. Redirect to login if no token exists and they are trying to access protected routes
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    // Store the attempted path to redirect back after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. If token exists, let them proceed
  return NextResponse.next();
}

export const config = {
  // Apply to all routes except API and static assets
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
