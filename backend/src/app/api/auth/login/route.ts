
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ---------------- CONFIG ---------------- */

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

/* ---------------- CORS PREFLIGHT ---------------- */

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": FRONTEND,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

/* ---------------- LOGIN HANDLER ---------------- */

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return cors(
        NextResponse.json(
          { error: "Email and password required" },
          { status: 400 }
        )
      );
    }

    /* ---------- FIND USER ---------- */

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return cors(
        NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        )
      );
    }

    /* ---------- CHECK PASSWORD ---------- */

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return cors(
        NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        )
      );
    }

    /* ---------- CREATE JWT ---------- */

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    /* ---------- RESPONSE ---------- */

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

    /* ---------- SET COOKIE ---------- */

    res.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return cors(res);
  } catch (error) {
    console.error("Login Error:", error);

    return cors(
      NextResponse.json(
        { error: "Login failed" },
        { status: 500 }
      )
    );
  }
}

/* ---------------- CORS HELPER ---------------- */

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}

