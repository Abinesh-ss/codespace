import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/* ---------- CORS ---------- */
function cors(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: cors(req.headers.get("origin") || undefined),
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { qrId: string } }
) {
  try {
    const origin = req.headers.get("origin") || undefined;
    const { qrId } = params;

    if (!qrId) {
      return NextResponse.json(
        { error: "QR ID missing" },
        { status: 400, headers: cors(origin) }
      );
    }

    const poi = await prisma.poi.findUnique({
      where: { qrId },
      include: {
        map: {
          select: { hospitalId: true },
        },
        floor: {
          select: {
            id: true,
            level: true,
          },
        },
      },
    });

    if (!poi) {
      return NextResponse.json(
        { error: "Location QR not recognized" },
        { status: 404, headers: cors(origin) }
      );
    }

    /* ✅ CRITICAL FIX: include x & y */
    return NextResponse.json(
      {
        nodeId: poi.nodeId,
        locationName: poi.name,
        floorId: poi.floor?.id || null,
        floorLevel: poi.floor?.level || null,
        hospitalId: poi.map?.hospitalId,

        // ✅ ADD THESE
        x: Number(poi.x) || 0,
        y: Number(poi.y) || 0,
      },
      { status: 200, headers: cors(origin) }
    );
  } catch (err) {
    console.error("Scan API Error:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
