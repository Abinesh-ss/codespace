import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

const FRONTEND =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

/* ✅ CORS PREFLIGHT */
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

/* ✅ SIGNUP */
export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return cors(
        NextResponse.json(
          { error: "Email and password required" },
          { status: 400 }
        )
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return cors(
        NextResponse.json(
          { error: "User already exists" },
          { status: 409 }
        )
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    return cors(
      NextResponse.json(
        {
          message: "Signup successful",
          user: {
            id: user.id,
            email: user.email,
          },
        },
        { status: 201 }
      )
    );
  } catch (e) {
    console.error("SIGNUP ERROR:", e);
    return cors(
      NextResponse.json(
        { error: "Signup failed" },
        { status: 500 }
      )
    );
  }
}

/* 🔁 SHARED CORS */
function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}

