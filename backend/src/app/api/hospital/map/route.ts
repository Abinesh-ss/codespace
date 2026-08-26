import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; 
import jwt from "jsonwebtoken";

const FRONTEND = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    // 1. Read token from Authorization header FIRST, fallback to Cookies
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.cookies.get("auth-token")?.value;

    if (!token) {
      return cors(NextResponse.json({ error: "Unauthorized: No token found" }, { status: 401 }));
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return cors(NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }));
    }

    // 2. Extract user ID safely (JWT payloads vary between 'userId', 'id', or 'sub')
    const userId = payload.userId || payload.id || payload.sub; 

    if (!userId) {
      return cors(NextResponse.json({ error: "Invalid token payload" }, { status: 401 }));
    }

    const body = await req.json();
    const { name, imageUrl } = body; 

    if (!name || !imageUrl) {
      return cors(NextResponse.json({ error: "Missing required fields: name or imageUrl" }, { status: 400 }));
    }

    const hospital = await prisma.hospital.findFirst({
      where: { 
        createdByUser: userId 
      }
    });

    if (!hospital) {
      return cors(NextResponse.json({ 
        error: "No hospital profile found. Please create a hospital profile first." 
      }, { status: 404 }));
    }

    const newMap = await prisma.map.create({
      data: {
        name: name,
        imageUrl: imageUrl, 
        hospitalId: hospital.id,
      },
    });

    return cors(NextResponse.json({ 
      success: true, 
      mapId: newMap.id,
      message: "Map uploaded and linked to hospital successfully"
    }, { status: 201 }));

  } catch (error: any) {
    console.error("DB_SAVE_ERROR:", error);
    return cors(NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 }));
  }
}
