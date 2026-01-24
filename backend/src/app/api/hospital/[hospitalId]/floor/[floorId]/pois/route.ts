import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/* ---------- CORS ---------- */
function cors(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

/* ---------- GET POIs ---------- */
export async function GET(
  req: NextRequest,
  { params }: { params: { hospitalId: string; floorId: string } }
) {
  const origin = req.headers.get("origin") || undefined;

  try {
    const { hospitalId, floorId } = params;

    /* 1️⃣ Validate floor */
    const floor = await prisma.floor.findFirst({
      where: {
        id: floorId,
        hospitalId,
      },
    });

    if (!floor) {
      return NextResponse.json(
        { error: "Floor not found" },
        { status: 404, headers: cors(origin) }
      );
    }

    /* 2️⃣ Get existing Map */
    const mapRecord = await prisma.map.findFirst({
      where: {
        hospitalId: floor.hospitalId,
      },
    });

    if (!mapRecord) {
      return NextResponse.json(
        { error: "Map not created yet for this hospital" },
        { status: 404, headers: cors(origin) }
      );
    }

    /* 3️⃣ Extract POIs from graphData */
    const points =
      (floor.graphData as any)?.pointsOfInterest ?? [];

    const enrichedPOIs: any[] = [];

    for (const poi of points) {
      if (!poi?.name || poi.x === undefined || poi.y === undefined) {
        continue;
      }

      /* 4️⃣ Check if POI already exists */
      let dbPoi = await prisma.poi.findFirst({
        where: {
          OR: [
            poi.nodeId ? { nodeId: poi.nodeId } : undefined,
            {
              mapId: mapRecord.id,
              name: poi.name,
            },
          ].filter(Boolean) as any,
        },
      });

      /* 5️⃣ Create POI if missing */
      if (!dbPoi) {
        const safeNodeId =
          poi.nodeId && poi.nodeId.trim() !== ""
            ? poi.nodeId
            : crypto.randomUUID();

        try {
          dbPoi = await prisma.poi.create({
            data: {
              name: poi.name,
              type: poi.type || "general",
              x: Number(poi.x),
              y: Number(poi.y),
              mapId: mapRecord.id,
              floorId: floorId,
              qrId: crypto.randomUUID(),
              nodeId: safeNodeId,
            },
          });
        } catch (e: any) {
          // Handle unique constraint on nodeId
          if (e.code === "P2002" && safeNodeId) {
            dbPoi = await prisma.poi.findUnique({
              where: { nodeId: safeNodeId },
            });
          } else {
            throw e;
          }
        }
      }

      if (!dbPoi) continue;

      enrichedPOIs.push({
        ...poi,
        dbId: dbPoi.id,
        qrId: dbPoi.qrId,
        nodeId: dbPoi.nodeId,
      });
    }

    return NextResponse.json(enrichedPOIs, {
      headers: cors(origin),
    });
  } catch (error: any) {
    console.error("POI API ERROR:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message,
      },
      { status: 500, headers: cors(origin) }
    );
  }
}

/* ---------- OPTIONS ---------- */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: cors(req.headers.get("origin") || undefined),
  });
}

