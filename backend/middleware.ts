import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

export async function middleware(req: NextRequest) {
  /* ---------- CORS PRE-FLIGHT ---------- */
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": FRONTEND_URL,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  /* ---------- AUTH CHECK (PROD ONLY) ---------- */
  if (
    req.nextUrl.pathname.startsWith("/api/hospital") &&
    process.env.NODE_ENV === "production"
  ) {
    const sessionToken =
      req.cookies.get("next-auth.session-token") ||
      req.cookies.get("__Secure-next-auth.session-token");

    if (!sessionToken && req.method === "POST") {
      return NextResponse.json(
        { error: "Unauthorized: No session found" },
        { status: 401 }
      );
    }
  }

  /* ---------- DEFAULT RESPONSE ---------- */
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", FRONTEND_URL);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

