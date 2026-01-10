// lib/auth/jwt.ts
import { NextRequest } from "next/server";

const SECRET = process.env.JWT_SECRET || "dev-secret";

/**
 * Simple base64 token helpers
 * (matches how your auth-token cookie is currently used)
 */

export interface AuthPayload {
  userId: string;
  email: string;
}

/* 🔐 Create token */
export function signToken(payload: AuthPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/* 🔓 Verify token from Authorization header OR cookie */
export function verifyToken(req: NextRequest): AuthPayload {
  // 1️⃣ Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    return JSON.parse(Buffer.from(token, "base64").toString());
  }

  // 2️⃣ Cookie fallback
  const cookie = req.cookies.get("auth-token")?.value;
  if (cookie) {
    return JSON.parse(Buffer.from(cookie, "base64").toString());
  }

  throw new Error("Unauthorized");
}

