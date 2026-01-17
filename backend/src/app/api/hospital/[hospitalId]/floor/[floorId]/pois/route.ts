import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

function cors(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { hospitalId: string; floorId: string } }
) {
  const origin = req.headers.get("origin") || undefined;

  try {
    const { hospitalId, floorId } = params;

    // 1. Get the Floor (The source of your graph/POI data)
    const floor = await prisma.floor.findFirst({
      where: { id: floorId, hospitalId },
    });

    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404, headers: cors(origin) });
    }

    // 2. SELF-HEALING: Find or Create the Map record
    // We need a record in the 'Map' table to satisfy the POI foreign key
    let mapRecord = await prisma.map.findUnique({
      where: { id: floorId }, // Checking if Map shares the same ID
    });

    if (!mapRecord) {
      // Create a Map record so the POIs have a parent
      mapRecord = await prisma.map.create({
        data: {
          id: floor.id, // Keeping IDs synced for simplicity
          name: floor.name,
          hospitalId: floor.hospitalId,
          imageUrl: "", // Placeholder since Floor doesn't have an image field
        },
      });
    }

    // 3. Extract POIs from graphData
    const points = (floor.graphData as any)?.pointsOfInterest || [];
    const enrichedPOIs = [];

    for (const poi of points) {
      if (!poi?.name || poi.x === undefined || poi.y === undefined) continue;

      // 4. Sync POIs to the Map
      let dbPoi = await prisma.poi.findFirst({
        where: {
          mapId: mapRecord.id,
          name: poi.name,
        },
      });

      if (!dbPoi) {
        dbPoi = await prisma.poi.create({
          data: {
            name: poi.name,
            type: poi.type || "general",
            x: Number(poi.x),
            y: Number(poi.y),
            mapId: mapRecord.id, // Now guaranteed to exist
            qrId: crypto.randomUUID(),
          },
        });
      }

      enrichedPOIs.push({
        ...poi,
        dbId: dbPoi.id,
        qrId: dbPoi.qrId,
      });
    }

    return NextResponse.json(enrichedPOIs, { headers: cors(origin) });
  } catch (error: any) {
    console.error("POI API ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500, headers: cors(origin) }
    );
  }
}
