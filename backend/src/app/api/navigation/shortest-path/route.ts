import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/index";
import { AStarService } from "@/lib/services/a-star.service";

/* ---------------- GLOBAL CORS ---------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function setCorsHeaders(res: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

/* ---------------- OPTIONS HANDLER ---------------- */
export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}

/* ---------------- TYPES ---------------- */
type GraphPOI = {
  nodeId: string;
  x: number;
  y: number;
  name?: string;
  type?: string;
  floorId?: string;
};

type GraphRoute = {
  from: string;
  to: string;
  distance: number;
  floorId?: string;
};

type GraphData = {
  pointsOfInterest: GraphPOI[];
  routes: GraphRoute[];
};

type Edge = {
  from: string;
  to: string;
  weight: number;
};

/* ---------------- DIJKSTRA ---------------- */
function dijkstra(
  nodes: string[],
  edges: Edge[],
  start: string,
  end: string
) {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const unvisited = new Set(nodes);

  nodes.forEach((node) => {
    dist[node] = Infinity;
    prev[node] = null;
  });

  dist[start] = 0;

  while (unvisited.size > 0) {
    const current = [...unvisited].reduce((a, b) =>
      dist[a] < dist[b] ? a : b
    );

    if (!current || dist[current] === Infinity) break;

    if (current === end) break;

    unvisited.delete(current);

    const neighbors = edges.filter(
      (edge) => edge.from === current || edge.to === current
    );

    for (const edge of neighbors) {
      const next = edge.from === current ? edge.to : edge.from;

      if (!unvisited.has(next)) continue;

      const alt = dist[current] + edge.weight;

      if (alt < dist[next]) {
        dist[next] = alt;
        prev[next] = current;
      }
    }
  }

  const path: string[] = [];
  let curr: string | null = end;

  while (curr) {
    path.unshift(curr);
    curr = prev[curr];
  }

  return path[0] === start ? path : null;
}

/* ---------------- HELPERS ---------------- */
function calculateRotation(
  current: { x: number; y: number },
  next: { x: number; y: number }
) {
  const dx = next.x - current.x;
  const dy = next.y - current.y;

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return angle;
}

/* ---------------- GET HANDLER (A* Service) ---------------- */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const floorId = searchParams.get("floorId");
    const startNodeId = searchParams.get("startNodeId");
    const endNodeId = searchParams.get("endNodeId");

    if (!floorId || !startNodeId || !endNodeId) {
      return setCorsHeaders(
        NextResponse.json({ error: "Missing parameters: floorId, startNodeId, and endNodeId are required" }, { status: 400 })
      );
    }

    const floor = await prisma.floor.findUnique({
      where: { id: floorId }
    });

    if (!floor) {
      return setCorsHeaders(
        NextResponse.json({ error: "Target floor record not found" }, { status: 404 })
      );
    }

    // Run path calculation over graphData JSON data structure
    const path = AStarService.calculatePath(floor.graphData, startNodeId, endNodeId);

    if (path.length === 0) {
      return setCorsHeaders(
        NextResponse.json({ error: "No connection route found between selected points" }, { status: 404 })
      );
    }

    return setCorsHeaders(NextResponse.json({ success: true, path }));
  } catch (error: any) {
    console.error("SHORTEST_PATH_ROUTE_ERROR:", error);
    return setCorsHeaders(
      NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    );
  }
}

/* ---------------- POST HANDLER (Dijkstra) ---------------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      hospitalId,
      floorId,
      startNodeId,
      endNodeId,
    } = body;

    /* ---------------- VALIDATION ---------------- */
    if (!hospitalId) {
      return setCorsHeaders(
        NextResponse.json({ error: "hospitalId required" }, { status: 400 })
      );
    }

    if (!floorId) {
      return setCorsHeaders(
        NextResponse.json({ error: "floorId required" }, { status: 400 })
      );
    }

    if (!startNodeId || !endNodeId) {
      return setCorsHeaders(
        NextResponse.json({ error: "startNodeId and endNodeId required" }, { status: 400 })
      );
    }

    /* ---------------- GET FLOOR ---------------- */
    const floor = await prisma.floor.findFirst({
      where: {
        hospitalId,
        OR: [
          { level: Number(floorId) },
          { id: floorId },
        ],
      },
      select: {
        id: true,
        level: true,
        graphData: true,
      },
    });

    if (!floor?.graphData) {
      return setCorsHeaders(
        NextResponse.json({ error: "Map not found" }, { status: 404 })
      );
    }

    const graph = floor.graphData as unknown as GraphData;

    /* ---------------- SAFETY ---------------- */
    if (
      !graph.pointsOfInterest ||
      !Array.isArray(graph.pointsOfInterest)
    ) {
      return setCorsHeaders(
        NextResponse.json({ error: "Invalid POI data" }, { status: 500 })
      );
    }

    if (
      !graph.routes ||
      !Array.isArray(graph.routes)
    ) {
      return setCorsHeaders(
        NextResponse.json({ error: "Invalid route data" }, { status: 500 })
      );
    }

    /* ---------------- BUILD GRAPH ---------------- */
    const nodes = graph.pointsOfInterest.map(
      (poi) => poi.nodeId
    );

    const edges: Edge[] = graph.routes.map((route) => ({
      from: route.from,
      to: route.to,
      weight: Number(route.distance) || 1,
    }));

    /* ---------------- VALIDATE NODES ---------------- */
    if (!nodes.includes(startNodeId)) {
      return setCorsHeaders(
        NextResponse.json({ error: "Invalid start node" }, { status: 404 })
      );
    }

    if (!nodes.includes(endNodeId)) {
      return setCorsHeaders(
        NextResponse.json({ error: "Invalid destination node" }, { status: 404 })
      );
    }

    /* ---------------- FIND PATH ---------------- */
    const pathIds = dijkstra(
      nodes,
      edges,
      startNodeId,
      endNodeId
    );

    if (!pathIds) {
      return setCorsHeaders(
        NextResponse.json({ error: "No path found" }, { status: 404 })
      );
    }

    /* ---------------- NODE → FULL PATH ---------------- */
    const path = pathIds.map((nodeId, index) => {
      const poi = graph.pointsOfInterest.find(
        (p) => p.nodeId === nodeId
      );

      const nextPoi =
        index < pathIds.length - 1
          ? graph.pointsOfInterest.find(
              (p) => p.nodeId === pathIds[index + 1]
            )
          : null;

      return {
        nodeId,
        name: poi?.name || "",
        type: poi?.type || "general",
        floorId: poi?.floorId || String(floor.level),
        x: Number(poi?.x) || 0,
        y: Number(poi?.y) || 0,
        rotation:
          nextPoi && poi
            ? calculateRotation(
                {
                  x: Number(poi.x),
                  y: Number(poi.y),
                },
                {
                  x: Number(nextPoi.x),
                  y: Number(nextPoi.y),
                }
              )
            : 0,
      };
    });

    /* ---------------- TOTAL DISTANCE ---------------- */
    let totalDistance = 0;

    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += Math.hypot(
        path[i + 1].x - path[i].x,
        path[i + 1].y - path[i].y
      );
    }

    /* ---------------- ETA ---------------- */
    const walkingSpeed = 80;
    const estimatedSeconds = Math.ceil(
      totalDistance / walkingSpeed
    );

    /* ---------------- RESPONSE ---------------- */
    return setCorsHeaders(
      NextResponse.json({
        success: true,
        floor: {
          id: floor.id,
          level: floor.level,
        },
        path,
        summary: {
          nodes: path.length,
          distance: Math.round(totalDistance),
          estimatedSeconds,
        },
      }, { status: 200 })
    );
  } catch (err) {
    console.error("Navigation Error:", err);
    return setCorsHeaders(
      NextResponse.json({ error: "Server error" }, { status: 500 })
    );
  }
}
