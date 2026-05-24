import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ---------------- CORS ---------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/* ---------------- OPTIONS HANDLER ---------------- */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: corsHeaders,
    }
  );
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

/* ---------------- API ---------------- */
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
      return NextResponse.json(
        { error: "hospitalId required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!floorId) {
      return NextResponse.json(
        { error: "floorId required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!startNodeId || !endNodeId) {
      return NextResponse.json(
        { error: "startNodeId and endNodeId required" },
        { status: 400, headers: corsHeaders }
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
      return NextResponse.json(
        { error: "Map not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const graph = floor.graphData as unknown as GraphData;

    /* ---------------- SAFETY ---------------- */
    if (
      !graph.pointsOfInterest ||
      !Array.isArray(graph.pointsOfInterest)
    ) {
      return NextResponse.json(
        { error: "Invalid POI data" },
        { status: 500, headers: corsHeaders }
      );
    }

    if (
      !graph.routes ||
      !Array.isArray(graph.routes)
    ) {
      return NextResponse.json(
        { error: "Invalid route data" },
        { status: 500, headers: corsHeaders }
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
      return NextResponse.json(
        { error: "Invalid start node" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!nodes.includes(endNodeId)) {
      return NextResponse.json(
        { error: "Invalid destination node" },
        { status: 404, headers: corsHeaders }
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
      return NextResponse.json(
        { error: "No path found" },
        { status: 404, headers: corsHeaders }
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
    return NextResponse.json(
      {
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
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    console.error("Navigation Error:", err);

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
