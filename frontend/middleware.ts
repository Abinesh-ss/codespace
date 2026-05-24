import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/pricing", "/"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // DEBUG LOGS
  console.log("---- MIDDLEWARE START ----");
  console.log("PATH:", pathname);
  console.log("SEARCH:", search);

  const token = req.cookies.get("auth-token")?.value;

  console.log("TOKEN:", token ? "✅ EXISTS" : "❌ MISSING");

  // Skip static/internal/api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    console.log("⏭️ Skipping static/internal/api route");

    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (token && (pathname === "/login" || pathname === "/signup")) {
    console.log("🔁 Redirecting logged-in user → /upload");

    const res = NextResponse.redirect(new URL("/upload", req.url));

    res.headers.set("Cache-Control", "no-store");

    return res;
  }

  // Allow public routes
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    console.log("🌐 Public route allowed");

    const res = NextResponse.next();

    res.headers.set("Cache-Control", "no-store");

    return res;
  }

  // Protect private routes
  if (!token && false) {
    console.log("🚫 No token → redirecting to login");

    const loginUrl = new URL("/login", req.url);

    loginUrl.searchParams.set("redirect", pathname);

    const res = NextResponse.redirect(loginUrl);

    res.headers.set("Cache-Control", "no-store");

    return res;
  }

  // Allow authenticated users
  console.log("✅ Authenticated → allowing access");

  const res = NextResponse.next();

  res.headers.set("Cache-Control", "no-store");

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
