import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

// Helper to handle CORS
function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

/** * GET: Fetch floors for a specific hospital
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return cors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get("hospitalId");

    if (!hospitalId) {
      return cors(NextResponse.json({ error: "hospitalId is required" }, { status: 400 }));
    }

    const floors = await prisma.floor.findMany({
      where: { hospitalId: hospitalId },
      orderBy: { level: 'asc' }
    });

    return cors(NextResponse.json(floors, { status: 200 }));
  } catch (error: any) {
    console.error("GET Floor Error:", error);
    return cors(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

/**
 * POST: Save or Update Floor and Sync POIs
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return cors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const body = await req.json();
    const { hospitalId, name, graphData, mapId, level } = body;

    // 1. FIND VALID MAP ID
    // Your DB requires POIs to link to a 'Map' record, not just the 'Hospital' ID.
    const hospitalMap = await prisma.map.findFirst({
      where: { hospitalId: hospitalId }
    });

    if (!hospitalMap) {
      return cors(NextResponse.json({ 
        error: "No Map record found for this hospital. Please create a map in the dashboard first." 
      }, { status: 400 }));
    }

    let floor;
    const isPlaceholder = !mapId || mapId === 'new-uuid-placeholder' || mapId === 'undefined';
    
    // 2. SAVE OR UPDATE FLOOR (Using upsert to prevent P2025 errors)
    if (isPlaceholder) {
      floor = await prisma.floor.create({
        data: { 
          name: name || "New Floor", 
          hospitalId, 
          graphData: graphData || {}, 
          level: Number(level || 1) 
        },
      });
    } else {
      floor = await prisma.floor.upsert({
        where: { id: mapId },
        update: { 
          graphData: graphData || {}, 
          name: name || "Updated Floor", 
          level: Number(level) || 0 
        },
        create: {
          id: mapId,
          name: name || "New Floor",
          hospitalId,
          graphData: graphData || {},
          level: Number(level) || 0
        }
      });
    }

    // 3. ATOMIC SYNC: POI Table <=> Graph JSON
    if (graphData && graphData.pointsOfInterest && Array.isArray(graphData.pointsOfInterest)) {
      const currentNodesInGraph = graphData.pointsOfInterest.map((p: any) => p.nodeId);

      // Delete POIs removed from the editor
      await prisma.poi.deleteMany({
        where: { 
          floorId: floor.id, 
          nodeId: { notIn: currentNodesInGraph } 
        }
      });

      // Upsert current POIs
      await Promise.all(graphData.pointsOfInterest.map((poiNode: any) => {
        return prisma.poi.upsert({
          where: { nodeId: poiNode.nodeId },
          update: {
            name: poiNode.name,
            x: poiNode.x,
            y: poiNode.y,
            type: poiNode.type || "general",
            floorId: floor.id,
          },
          create: {
            nodeId: poiNode.nodeId,
            name: poiNode.name,
            qrId: poiNode.qrId || crypto.randomUUID(),
            x: poiNode.x,
            y: poiNode.y,
            type: poiNode.type || "general",
            floorId: floor.id,
            mapId: hospitalMap.id // Using the valid Map ID found in Step 1
          }
        });
      }));
    }

    return cors(NextResponse.json(floor, { status: 201 }));
  } catch (error: any) {
    console.error("Floor Sync Error:", error);
    return cors(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
