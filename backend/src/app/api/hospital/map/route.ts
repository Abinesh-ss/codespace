import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; 
import jwt from "jsonwebtoken";

// List all domains that are allowed to call this API
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://codespace-f.vercel.app", // Add your production frontend URL here
];

function cors(res: NextResponse, req: NextRequest) {
  const origin = req.headers.get("origin");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    // Fallback for safety
    res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }

  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return cors(new NextResponse(null, { status: 204 }), req);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.cookies.get("auth-token")?.value;

    if (!token) {
      return cors(
        NextResponse.json({ error: "Unauthorized: No token found" }, { status: 401 }),
        req
      );
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return cors(
        NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
        req
      );
    }

    const userId = payload.userId || payload.id || payload.sub;
    if (!userId) {
      return cors(
        NextResponse.json({ error: "Invalid token payload" }, { status: 401 }),
        req
      );
    }

    const body = await req.json();
    const { name, imageUrl } = body;

    if (!name || !imageUrl) {
      return cors(
        NextResponse.json({ error: "Missing required fields" }, { status: 400 }),
        req
      );
    }

    const hospital = await prisma.hospital.findFirst({
      where: { createdByUser: userId },
    });

    if (!hospital) {
      return cors(
        NextResponse.json(
          { error: "No hospital profile found." },
          { status: 404 }
        ),
        req
      );
    }

    const newMap = await prisma.map.create({
      data: {
        name,
        imageUrl,
        hospitalId: hospital.id,
      },
    });

    return cors(
      NextResponse.json(
        { success: true, mapId: newMap.id, message: "Map uploaded successfully" },
        { status: 201 }
      ),
      req
    );
  } catch (error: any) {
    console.error("DB_SAVE_ERROR:", error);
    return cors(
      NextResponse.json(
        { error: "Internal Server Error", details: error.message },
        { status: 500 }
      ),
      req
    );
  }
}
