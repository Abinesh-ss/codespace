import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

// List of recognized development and production domains
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://hospinav.vercel.app",
];

/* 🔁 DYNAMIC CORS HELPER */
function cors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    // Standard secure production fallback
    res.headers.set("Access-Control-Allow-Origin", "https://hospinav.vercel.app");
  }

  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

/* ✅ CORS PREFLIGHT */
export async function OPTIONS(req: NextRequest) {
  return cors(req, new NextResponse(null, { status: 204 }));
}

/* ✅ SIGNUP */
export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return cors(
        req,
        NextResponse.json(
          { error: "Email and password required" },
          { status: 400 }
        )
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return cors(
        req,
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
      req,
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
      req,
      NextResponse.json(
        { error: "Signup failed" },
        { status: 500 }
      )
    );
  }
}
