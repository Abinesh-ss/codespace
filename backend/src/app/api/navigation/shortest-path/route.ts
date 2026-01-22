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
        { error: "Missing required fields", required: ["floorId", "startNodeId", "endNodeId", "hospitalId"] },
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

    if (!floorData || !floorData.graphData) {
      return NextResponse.json(
        { error: "Floor graph data not found" },
        { status: 404 }
      );
    }

    /* ------------------ 3️⃣ Read graph ------------------ */
    const rawGraph = floorData.graphData as any;

    const routes = Array.isArray(rawGraph.routes) ? rawGraph.routes : [];

    if (routes.length === 0) {
      return NextResponse.json(
        { error: "No routes defined in floor graph" },
        { status: 404 }
      );
    }

    /* ------------------ 4️⃣ Build node index ------------------ */
    const nodeIds = new Set<string>();

    routes.forEach((r: any) => {
      if (r.from != null) nodeIds.add(String(r.from));
      if (r.to != null) nodeIds.add(String(r.to));
    });

    const startId = String(startNodeId);
    const endId = String(endNodeId);

    if (!nodeIds.has(startId) || !nodeIds.has(endId)) {
      return NextResponse.json(
        {
          error: "Start or destination node not found on this floor",
          details: {
            startFound: nodeIds.has(startId),
            endFound: nodeIds.has(endId),
          },
        },
        { status: 404 }
      );
    }

    /* ------------------ 5️⃣ Build A* graph ------------------ */
    const edges = routes.map((r: any) => ({
      source: String(r.from),
      target: String(r.to),
      weight: Number(r.distance) > 0 ? Number(r.distance) : 1,
    }));

    const graphForAStar = {
      nodes: Array.from(nodeIds).map((id) => ({ id })),
      edges,
    };

    /* ------------------ 6️⃣ Run A* ------------------ */
    const path = calculateAStarPath(
      graphForAStar,
      startId,
      endId
    );

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

