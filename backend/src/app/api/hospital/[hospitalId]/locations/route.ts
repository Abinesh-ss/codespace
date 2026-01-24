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
  { params }: { params: { hospitalId: string } }
) {
  try {
    const origin = req.headers.get("origin") || undefined;
    const { hospitalId } = params;

    if (!hospitalId) {
      return NextResponse.json(
        { error: "Hospital ID missing" },
        { status: 400, headers: cors(origin) }
      );
    }

    console.log("📌 Hospital ID received:", hospitalId);

    /* ---------- 1️⃣ Validate hospital ---------- */
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true, name: true },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: "Hospital not found" },
        { status: 404, headers: cors(origin) }
      );
    }

    /* ---------- 2️⃣ Fetch maps ---------- */
    const maps = await prisma.map.findMany({
      where: { hospitalId },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    });

    console.log("🗺️ Maps found:", maps.length);

    if (maps.length === 0) {
      return NextResponse.json(
        {
          hospitalId,
          hospitalName: hospital.name,
          locations: [],
          message: "No maps found for this hospital",
        },
        { status: 200, headers: cors(origin) }
      );
    }

    const mapIds = maps.map((m) => m.id);

    /* ---------- 3️⃣ Fetch POIs safely ---------- */
    const pois = await prisma.poi.findMany({
      where: {
        mapId: { in: mapIds }, // ✅ NO LEFT JOIN TRAP
      },
      select: {
        id: true,
        name: true,
        qrId: true,
        type: true,
        x: true,
        y: true,
        nodeId: true,
        mapId: true,
        floor: {
          select: {
            id: true,
            level: true,
          },
        },
      },
    });

    console.log("📍 POIs found:", pois.length);

    /* ---------- 4️⃣ Group POIs by map ---------- */
    const locations = maps.map((map) => ({
      mapId: map.id,
      mapName: map.name,
      imageUrl: map.imageUrl,
      pois: pois.filter((p) => p.mapId === map.id),
    }));

    return NextResponse.json(
      {
        hospitalId,
        hospitalName: hospital.name,
        totalMaps: maps.length,
        totalPois: pois.length,
        locations,
      },
      { status: 200, headers: cors(origin) }
    );
  } catch (error) {
    console.error("❌ Locations API Error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

