import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/* ---------------- CORS ---------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/* Preflight */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/* GET hospital locations */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = params.id;

    // 1️⃣ Fetch all map IDs belonging to this hospital
    const maps = await prisma.map.findMany({
      where: { hospitalId },
      select: { id: true },
    });

    if (!maps.length) {
      return NextResponse.json([], { headers: corsHeaders });
    }

    const mapIds = maps.map((m) => m.id);

    // 2️⃣ Fetch all POIs belonging to those maps
    const locations = await prisma.poi.findMany({
      where: { mapId: { in: mapIds } },
      select: {
        id: true,
        name: true,
        type: true,
        x: true,
        y: true,
        map: {
          select: {
            id: true,
            name: true, // floor / map name
          },
        },
      },
    });

    return NextResponse.json(locations, { headers: corsHeaders });
  } catch (error) {
    console.error("Hospital locations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500, headers: corsHeaders }
    );
  }
}

