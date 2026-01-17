import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { qrId: string } }
) {
  try {
    const { qrId } = params;

    // 1. Find the POI by its unique qrId
    const poiRecord = await prisma.poi.findUnique({
      where: { qrId: qrId },
      include: { 
        map: true // This gets the associated map/floor info
      }
    });

    if (!poiRecord) {
      console.error(`[SCAN] qrId ${qrId} not found`);
      return NextResponse.json(
        { error: "Location QR not recognized" }, 
        { status: 404 }
      );
    }

    // 2. Return data in the exact format the PWA's ScanResponse interface expects
    return NextResponse.json({
      nodeId: poiRecord.id,           // Used for pathfinding start node
      locationName: poiRecord.name,   // Displayed as "Current Position"
      floorId: poiRecord.mapId,       // Links to the correct map/floor
      hospitalId: poiRecord.map?.hospitalId || "hospital_1"
    });
    
  } catch (err: any) {
    console.error("Scan API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message }, 
      { status: 500 }
    );
  }
}
