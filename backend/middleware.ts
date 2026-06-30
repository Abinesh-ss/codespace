import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://hospinav.vercel.app",
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  // Helper function to attach all required CORS headers to any response
  const addCorsHeaders = (response: NextResponse) => {
    if (isAllowedOrigin && origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    }
    return response;
  };

  // ✅ 1. PRE-FLIGHT (OPTIONS)
  if (req.method === "OPTIONS") {
    const preFlightRes = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin) {
      addCorsHeaders(preFlightRes);
      preFlightRes.headers.set("Access-Control-Max-Age", "86400");
    }
    return preFlightRes;
  }

  // ✅ 2. AUTH CHECK (production only)
  if (
    process.env.NODE_ENV === "production" &&
    req.nextUrl.pathname.startsWith("/api/hospital") &&
    ["POST", "PUT", "DELETE"].includes(req.method)
  ) {
    const session =
      req.cookies.get("next-auth.session-token") ||
      req.cookies.get("__Secure-next-auth.session-token");

    if (!session) {
      const unauthorizedRes = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      // CRITICAL: Must add CORS headers here, otherwise browser blocks reading the 401 status
      return addCorsHeaders(unauthorizedRes);
    }
  }

  // ✅ 3. NORMAL FLOW
  const res = NextResponse.next();
  return addCorsHeaders(res);
}

export const config = {
  matcher: "/api/:path*",
};
