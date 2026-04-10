import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/pricing", "/"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 🧠 DEBUG LOGS (check in Vercel logs)
  console.log("---- MIDDLEWARE START ----");
  console.log("PATH:", pathname);
  console.log("SEARCH:", search);

  const token = req.cookies.get("auth-token")?.value;
  console.log("TOKEN:", token ? "✅ EXISTS" : "❌ MISSING");

  // 1. Skip static & internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    console.log("⏭️ Skipping static/internal route");
    return NextResponse.next();
  }

  // 2. Prevent logged-in users from visiting login/signup
  if (token && (pathname === "/login" || pathname === "/signup")) {
    console.log("🔁 Redirecting logged-in user → /upload");

    const res = NextResponse.redirect(new URL("/upload", req.url));
    res.headers.set("Cache-Control", "no-store"); // 🚫 prevent cache
    return res;
  }

  // 3. Allow public routes
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    console.log("🌐 सार्वजनिक route allowed");
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  // 4. Protect private routes
  if (!token) {
    console.log("🚫 No token → redirecting to login");

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);

    const res = NextResponse.redirect(loginUrl);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  // 5. Allow authenticated access
  console.log("✅ Authenticated → allowing access");

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store"); // 🚫 prevent 304 cache
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
