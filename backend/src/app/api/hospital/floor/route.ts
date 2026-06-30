import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://hospinav.vercel.app",
  "https://codespace-f.vercel.app",
];

/* 🔁 DYNAMIC CORS HELPER */
function cors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    res.headers.set("Access-Control-Allow-Origin", "https://hospinav.vercel.app");
  }

  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  return res;
}

/* ✅ CORS PREFLIGHT */
export async function OPTIONS(req: NextRequest) {
  return cors(req, new NextResponse(null, { status: 204 }));
}

/* ✅ GET FLOORS */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return cors(req, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get("hospitalId");

    if (!hospitalId) {
      return cors(req, NextResponse.json({ error: "hospitalId is required" }, { status: 400 }));
    }

    const floors = await prisma.floor.findMany({
      where: { hospitalId },
      orderBy: { level: 'asc' }
    });
    return cors(req, NextResponse.json(floors, { status: 200 }));
  } catch (error: any) {
    console.error("GET Floor Error:", error);
    return cors(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

/* ✅ POST / UPDATE FLOORS WITH GRAPH SYNCING */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return cors(req, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const body = await req.json();
    const { hospitalId, name, graphData, mapId, level } = body;

    const hospitalMap = await prisma.map.findFirst({ where: { hospitalId } });
    if (!hospitalMap) {
      return cors(req, NextResponse.json({ error: "No primary Map record found. Set a base map first." }, { status: 400 }));
    }

    let floor;
    const isPlaceholder = !mapId || mapId === 'new-uuid-placeholder' || mapId === 'undefined';

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
        update: { graphData: graphData || {}, name: name || "Updated Floor", level: Number(level) || 0 },
        create: { id: mapId, name: name || "New Floor", hospitalId, graphData: graphData || {}, level: Number(level) || 0 }
      });
    }

    if (graphData && graphData.pointsOfInterest && Array.isArray(graphData.pointsOfInterest)) {
      const currentNodesInGraph = graphData.pointsOfInterest.map((p: any) => p.nodeId);

      await prisma.poi.deleteMany({
        where: { floorId: floor.id, nodeId: { notIn: currentNodesInGraph } }
      });

      await Promise.all(graphData.pointsOfInterest.map((poiNode: any) => {
        return prisma.poi.upsert({
          where: { nodeId: poiNode.nodeId },
          // FIXED: mapId relation bound explicitly keeping the relationship tree synced on updates
          update: {
            name: poiNode.name,
            x: parseFloat(poiNode.x),
            y: parseFloat(poiNode.y),
            type: poiNode.type || "general",
            floorId: floor.id,
            mapId: hospitalMap.id,
          },
          create: {
            nodeId: poiNode.nodeId,
            name: poiNode.name,
            qrId: poiNode.qrId || crypto.randomUUID(),
            x: parseFloat(poiNode.x),
            y: parseFloat(poiNode.y),
            type: poiNode.type || "general",
            floorId: floor.id,
            mapId: hospitalMap.id
          }
        });
      }));
    }

    return cors(req, NextResponse.json(floor, { status: 201 }));
  } catch (error: any) {
    console.error("Floor Sync Error:", error);
    return cors(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
