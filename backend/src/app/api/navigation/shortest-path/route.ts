import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateAStarPath } from "@/lib/services/a-star.service";
import { protectRoute } from "@/lib/auth/middleware";

/* ---------- OPTIONS ---------- */
export async function OPTIONS() {
  return NextResponse.json({});
}

/* ---------- CORE HANDLER ---------- */
async function handler(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { floorId, startNodeId, endNodeId, hospitalId } = body;

    if (!floorId || !startNodeId || !endNodeId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    /* ---------- FETCH FLOOR GRAPH ---------- */
    const floorData = await prisma.floor.findUnique({
      where: { id: floorId },
      select: {
        graphData: true,
        hospitalId: true,
      },
    });

    if (!floorData || !floorData.graphData) {
      return NextResponse.json(
        { error: "Floor graph data not found" },
        { status: 404 }
      );
    }

    /* ---------- PATH CALCULATION ---------- */
    const result = calculateAStarPath(
      floorData.graphData as any,
      startNodeId,
      endNodeId
    );

    /* ---------- ANALYTICS ---------- */
    await prisma.analyticsEvent.create({
      data: {
        eventType: "NAVIGATION_START",
        userId,
        hospitalId: hospitalId || floorData.hospitalId,
        metadata: {
          start: startNodeId,
          end: endNodeId,
          floorId,
        },
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Pathfinding Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to calculate path" },
      { status: 500 }
    );
  }
}

/* ---------- POST EXPORT ---------- */
export const POST =
  process.env.NODE_ENV === "development"
    ? async (req: NextRequest) => handler(req, "dev-user")
    : protectRoute(handler);

