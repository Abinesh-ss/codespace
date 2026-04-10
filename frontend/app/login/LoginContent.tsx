"use client";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * ✅ STRICT CORS (NO dynamic origin)
 */
function setCorsHeaders(res: NextResponse) {
  res.headers.set(
    "Access-Control-Allow-Origin",
    "https://codespace-f.vercel.app" // 🔥 YOUR FRONTEND URL
  );
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");

  return res;
}

/* ---------------- OPTIONS (Preflight) ---------------- */
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  return setCorsHeaders(res);
}

/* ---------------- POST (Login) ---------------- */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return setCorsHeaders(
        NextResponse.json(
          { error: "Email and password required" },
          { status: 400 }
        )
      );
    }

    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return setCorsHeaders(
        NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        )
      );
    }

    // 2. Validate Password
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return setCorsHeaders(
        NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        )
      );
    }

    // 3. Create JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 4. Create Response
    const res = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          planStatus: user.planStatus,
        },
      },
      { status: 200 }
    );

    // 5. ✅ SET COOKIE (CRITICAL)
    res.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "none", // 🔥 REQUIRED for cross-domain
      secure: true,     // 🔥 REQUIRED for HTTPS (Vercel)
    });

    return setCorsHeaders(res);

  } catch (error) {
    console.error("Login Error:", error);

    return setCorsHeaders(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
}
