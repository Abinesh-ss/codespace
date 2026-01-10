import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

// 1. Unified CORS Helper
function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

/**
 * GET: Retrieve all floors for a specific hospital
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return cors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get("hospitalId");

    if (!hospitalId) {
      return cors(NextResponse.json({ error: "Hospital ID required" }, { status: 400 }));
    }

    const floors = await prisma.floor.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' }
    });

    return cors(NextResponse.json(floors));
  } catch (error) {
    return cors(NextResponse.json({ error: "Server Error" }, { status: 500 }));
  }
}

/**
 * POST: Save or Update floor/graph data
 */
export async function POST(req: NextRequest) {
  try {
    // Auth Logic
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return cors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return cors(NextResponse.json({ error: "Invalid token" }, { status: 401 }));
    }

    const body = await req.json();
    const { hospitalId, name, graphData, mapId } = body;

    if (!hospitalId || !graphData) {
      return cors(NextResponse.json({ error: "Missing required data" }, { status: 400 }));
    }

    let floor;

    // 1. VALIDATION: Check if mapId is a real UUID before trying to update
    const isPlaceholder = !mapId || mapId === 'new-uuid-placeholder' || mapId === 'undefined';
    
    let existingFloor = null;
    if (!isPlaceholder) {
      existingFloor = await prisma.floor.findUnique({
        where: { id: mapId }
      });
    }

    // 2. BRANCHING LOGIC: Update or Create
    if (existingFloor) {
      // Record exists in DB, safe to update
      floor = await prisma.floor.update({
        where: { id: mapId },
        data: { 
          graphData, 
          name: name || existingFloor.name 
        }
      });
      console.log(`✅ Updated existing floor: ${mapId}`);
    } else {
      // No record found or was a placeholder, create new
      floor = await prisma.floor.create({
        data: {
          name: name || "Untitled Floor",
          hospitalId,
          graphData,
        },
      });
      console.log(`✨ Created new floor record: ${floor.id}`);
    }

    return cors(NextResponse.json(floor, { status: 201 }));
  } catch (error: any) {
    console.error("Floor Save Error:", error);
    return cors(NextResponse.json({ 
      error: "Failed to save floor data", 
      details: error.message 
    }, { status: 500 }));
  }
}
