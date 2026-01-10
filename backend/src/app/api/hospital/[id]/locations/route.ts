import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const locations = await prisma.poi.findMany({
      where: {
        map: {
          hospitalId: hospitalId,
        },
      },
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

    return NextResponse.json(locations, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Hospital locations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500, headers: corsHeaders }
    );
  }
}

