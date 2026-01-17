import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://hospinav.vercel.app",
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  // ✅ PRE-FLIGHT
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: isAllowedOrigin
        ? {
            "Access-Control-Allow-Origin": origin!,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
          }
        : {},
    });
  }

  // ✅ AUTH CHECK (production only)
  if (
    process.env.NODE_ENV === "production" &&
    req.nextUrl.pathname.startsWith("/api/hospital") &&
    ["POST", "PUT", "DELETE"].includes(req.method)
  ) {
    const session =
      req.cookies.get("next-auth.session-token") ||
      req.cookies.get("__Secure-next-auth.session-token");

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  // ✅ NORMAL FLOW
  const res = NextResponse.next();

  if (isAllowedOrigin) {
    res.headers.set("Access-Control-Allow-Origin", origin!);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};

