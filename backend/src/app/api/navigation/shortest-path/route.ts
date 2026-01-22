import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateAStarPath } from "@/lib/services/a-star.service";
import { protectRoute } from "@/lib/auth/middleware";

async function handler(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { floorId, startNodeId, endNodeId, hospitalId } = body;

    if (!floorId || !startNodeId || !endNodeId || !hospitalId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* 1️⃣ Fetch floor safely (by ID or level) */
    const isUUID = typeof floorId === "string" && floorId.length > 10;

    const floorData = await prisma.floor.findFirst({
      where: {
        hospitalId,
        ...(isUUID
          ? { id: floorId }
          : { level: Number(floorId) }),
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

    const rawData = floorData.graphData as any;
    const routes = rawData.routes || [];

    if (!Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json(
        { error: "No routes defined in graph data" },
        { status: 404 }
      );
    }

    /* 2️⃣ Build node set */
    const validNodeIds = new Set<string>();

    routes.forEach((r: any) => {
      if (r.from !== undefined) validNodeIds.add(String(r.from));
      if (r.to !== undefined) validNodeIds.add(String(r.to));
    });

    const startId = String(startNodeId);
    const endId = String(endNodeId);

    if (!validNodeIds.has(startId) || !validNodeIds.has(endId)) {
      return NextResponse.json(
        {
          error: "Location not found on map graph",
          details: {
            startFound: validNodeIds.has(startId),
            endFound: validNodeIds.has(endId),
          },
        },
        { status: 404 }
      );
    }

    /* 3️⃣ Convert to A* compatible graph */
    const edges = routes.map((r: any) => ({
      source: String(r.from),
      target: String(r.to),
      weight: Number(r.distance) || 1,
    }));

    const graphForAlgorithm = {
      nodes: Array.from(validNodeIds).map((id) => ({ id })),
      edges,
    };

    /* 4️⃣ Run A* */
    const path = calculateAStarPath(
      graphForAlgorithm,
      startId,
      endId
    );

    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: "No path found between nodes" },
        { status: 404 }
      );
    }

    return NextResponse.json({ path });

  } catch (error: any) {
    console.error("🔥 SHORTEST PATH ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

/* 🔐 Auth wrapper */
export const POST =
  process.env.NODE_ENV === "development"
    ? async (req: NextRequest) => handler(req, "dev-user")
    : protectRoute(handler);

