import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; 
import jwt from "jsonwebtoken";

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

// 1. CORS Utility to wrap every response
function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return res;
}

// 2. OPTIONS Handler (Crucial for fixing the "CORS header missing" error)
export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    // --- AUTH LOGIC ---
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return cors(NextResponse.json({ error: "Unauthorized: No token found" }, { status: 401 }));
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return cors(NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }));
    }

    // --- CORE LOGIC ---
    const userId = payload.userId; 
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

    // --- SUCCESS RESPONSE ---
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
