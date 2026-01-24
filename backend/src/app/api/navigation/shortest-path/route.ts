import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateAStarPath } from "@/lib/services/a-star.service";
import { protectRoute } from "@/lib/auth/middleware";

async function handler(req: NextRequest, userId: string) {
  try {
    /* ------------------ 1️⃣ Parse body ------------------ */
    const body = await req.json();
    console.log("🧭 NAV PAYLOAD:", body);

    const { floorId, startNodeId, endNodeId, hospitalId } = body;

    if (!floorId || !startNodeId || !endNodeId || !hospitalId) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          required: ["floorId", "startNodeId", "endNodeId", "hospitalId"] 
        },
        { status: 400 }
      );
    }

    /* ------------------ 2️⃣ Resolve floor ------------------ */
    const isUUID = typeof floorId === "string" && floorId.length > 10;

    const floorData = await prisma.floor.findFirst({
      where: {
        hospitalId,
        ...(isUUID ? { id: floorId } : { level: Number(floorId) }),
      },
      select: {
        id: true,
        graphData: true,
      },
    });

    if (!floorData) {
      return NextResponse.json(
        { error: "Floor not found" },
        { status: 404 }
      );
    }

    let graphData: any = floorData.graphData ?? { pointsOfInterest: [], routes: [] };

    /* ------------------ 3️⃣ Ensure POIs exist ------------------ */
    const poiNodeIds = new Set(graphData.pointsOfInterest.map((p: any) => String(p.id)));

    // Auto-add start node if missing
    if (!poiNodeIds.has(startNodeId)) {
      console.warn(`⚠️ Start node ${startNodeId} not in floor graph, adding it.`);
      graphData.pointsOfInterest.push({ id: startNodeId, name: "Start", x: 0, y: 0 });
      poiNodeIds.add(startNodeId);
    }

    // Auto-add end node if missing
    if (!poiNodeIds.has(endNodeId)) {
      console.warn(`⚠️ End node ${endNodeId} not in floor graph, adding it.`);
      graphData.pointsOfInterest.push({ id: endNodeId, name: "End", x: 0, y: 0 });
      poiNodeIds.add(endNodeId);
    }

    /* ------------------ 4️⃣ Build edges ------------------ */
    const routes = Array.isArray(graphData.routes) ? graphData.routes : [];

    if (routes.length === 0) {
      console.warn("⚠️ No routes defined in floor graph.");
    }

    const edges = routes.map((r: any) => ({
      source: String(r.from),
      target: String(r.to),
      weight: Number(r.distance) > 0 ? Number(r.distance) : 1,
    }));

    /* ------------------ 5️⃣ Build graph for A* ------------------ */
    const graphForAStar = {
      nodes: Array.from(poiNodeIds).map((id) => ({ id })),
      edges,
    };

    console.log("🔹 All nodes in this floor:", Array.from(poiNodeIds));
    console.log("🔹 StartId:", startNodeId, "EndId:", endNodeId);

    /* ------------------ 6️⃣ Run A* ------------------ */
    const path = calculateAStarPath(graphForAStar, startNodeId, endNodeId);

    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: "No path found between nodes" },
        { status: 404 }
      );
    }

    /* ------------------ 7️⃣ Success ------------------ */
    return NextResponse.json({
      floorId: floorData.id,
      path,
    });

  } catch (error: any) {
    console.error("🔥 SHORTEST PATH ERROR:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}

/* ------------------ 🔐 Auth wrapper ------------------ */
export const POST =
  process.env.NODE_ENV === "development"
    ? async (req: NextRequest) => handler(req, "dev-user")
    : protectRoute(handler);

