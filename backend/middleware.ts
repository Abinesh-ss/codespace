import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://hospinav.vercel.app",
  "https://codespace-f.vercel.app",
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
      // FIXED: Added missing critical headers ('X-CSRF-Token', 'Accept-Version', etc.) to match your original configuration
      response.headers.set(
        "Access-Control-Allow-Headers", 
        "Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-Token, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version"
      );
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
    const session = req.cookies.get("auth-token")?.value;

    if (!session) {
      const unauthorizedRes = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      return addCorsHeaders(unauthorizedRes);
    }
  }

  // ✅ 3. NORMAL FLOW
  // FIXED: Mutating headers via NextRequest context instead of directly modifying `NextResponse.next()`
  if (isAllowedOrigin && origin) {
    const requestHeaders = new Headers(req.headers);
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    // Inject CORS into the final outbound response stream safely
    return addCorsHeaders(response);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
