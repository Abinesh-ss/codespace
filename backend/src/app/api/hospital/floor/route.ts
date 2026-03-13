import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return cors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const body = await req.json();
    const { hospitalId, name, graphData, mapId, level } = body;

    let floor;
    const isPlaceholder = !mapId || mapId === 'new-uuid-placeholder' || mapId === 'undefined';
    
    // 1. Save or Update Floor
    if (!isPlaceholder) {
      floor = await prisma.floor.update({
        where: { id: mapId },
        data: { graphData, name: name || "Updated Floor", level: Number(level) }
      });
    } else {
      floor = await prisma.floor.create({
        data: { name: name || "New Floor", hospitalId, graphData, level: Number(level || 1) },
      });
    }

    // 2. ATOMIC SYNC: POI Table <=> Graph JSON
    if (graphData.pointsOfInterest && Array.isArray(graphData.pointsOfInterest)) {
      const currentNodesInGraph = graphData.pointsOfInterest.map((p: any) => p.nodeId);

      // Delete nodes removed in Editor
      await prisma.poi.deleteMany({
        where: { floorId: floor.id, nodeId: { notIn: currentNodesInGraph } }
      });

      // Upsert current nodes
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
            qrId: poiNode.qrId || crypto.randomUUID(), // Preserve qrId if it exists
            x: poiNode.x,
            y: poiNode.y,
            type: poiNode.type || "general",
            floorId: floor.id,
            hospitalId: hospitalId
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
