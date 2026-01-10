import { NextRequest } from "next/server";

/**
 * Extract userId from Authorization header or cookie
 * NOTE: Matches login route which creates base64-encoded JSON token
 */
export async function auth(req: NextRequest): Promise<string | null> {
  try {
    // 1️⃣ Try Authorization header (Bearer token)
    const authHeader = req.headers.get("authorization");
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2️⃣ Fallback to cookie
    if (!token) {
      token = req.cookies.get("auth-token")?.value || null;
    }

    if (!token) return null;

    // Decode base64 token (matches login route format)
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());

    return decoded.userId || null;
  } catch {
    return null;
  }
}

