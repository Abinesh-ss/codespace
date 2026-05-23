import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

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

export async function GET(req: NextRequest, { params }: { params: { qrId: string } }) {
  try {
    const origin = req.headers.get("origin") || undefined;
    const { qrId } = params;

    if (!qrId) {
      return NextResponse.json({ error: "QR ID missing" }, { status: 400, headers: cors(origin) });
    }

    const poi = await prisma.poi.findUnique({
      where: { qrId },
      include: {
        map: { select: { hospitalId: true } },
        floor: { select: { id: true, level: true, graphData: true } },
      },
    });

    if (!poi) {
      return NextResponse.json({ error: "Location QR not recognized" }, { status: 404, headers: cors(origin) });
    }

    // Fetch all POIs on this floor to populate the map
    const siblingPois = await prisma.poi.findMany({
      where: { floorId: poi.floorId },
    });

    return NextResponse.json(
      {
        nodeId: poi.nodeId,
        locationName: poi.name,
        floorId: String(poi.floorId), // Force string for frontend consistency[cite: 1]
        floorLevel: poi.floor?.level || null,
        hospitalId: poi.map?.hospitalId,
        x: Number(poi.x) || 0,
        y: Number(poi.y) || 0,
        graphData: poi.floor?.graphData || null,
        availablePois: siblingPois.map(p => ({
          id: p.id,
          name: p.name,
          nodeId: p.nodeId,
          x: Number(p.x),
          y: Number(p.y),
          type: p.type,
          floorId: String(p.floorId) // Force string here too[cite: 1]
        })),
      },
      { status: 200, headers: cors(origin) }
    );
  } catch (err) {
    console.error("Scan API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
