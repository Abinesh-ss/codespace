import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * CORS Helper: Applies required headers to every response.
 * When using credentials: true, Access-Control-Allow-Origin CANNOT be "*".
 */
function setCorsHeaders(res: NextResponse, origin: string | null) {
  const allowedOrigin = origin || process.env.NEXT_PUBLIC_FRONTEND_URL || "";
  
  res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}

/* ---------------- OPTIONS (Preflight) ---------------- */
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const res = new NextResponse(null, { status: 204 });
  return setCorsHeaders(res, origin);
}

/* ---------------- POST (Login Logic) ---------------- */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return setCorsHeaders(
        NextResponse.json({ error: "Email and password required" }, { status: 400 }),
        origin
      );
    }

    // 1. Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return setCorsHeaders(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 }),
        origin
      );
    }

    // 2. Check Password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return setCorsHeaders(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 }),
        origin
      );
    }

    // 3. Create JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 4. Build Response
    const res = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: { 
          id: user.id, 
          email: user.email, 
          planStatus: user.planStatus 
        },
      },
      { status: 200 }
    );

    // 5. Set Cookie (Crucial for Cross-Domain)
    res.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      // Must be 'none' and 'secure' for cross-site Vercel domains
      sameSite: "none", 
      secure: true,    
    });

    return setCorsHeaders(res, origin);

  } catch (error) {
    console.error("Login Error:", error);
    return setCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      origin
    );
  }
}
