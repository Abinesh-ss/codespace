import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ---------------- Types ---------------- */
type GraphPOI = {
  nodeId: string;
  x: number;
  y: number;
  name?: string;
};

type GraphRoute = {
  from: string;
  to: string;
  distance: number;
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
function dijkstra(nodes: string[], edges: Edge[], start: string, end: string) {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const unvisited = new Set(nodes);

  nodes.forEach((n) => {
    dist[n] = Infinity;
    prev[n] = null;
  });

  dist[start] = 0;

  while (unvisited.size) {
    const current = [...unvisited].reduce((a, b) =>
      dist[a] < dist[b] ? a : b
    );

    if (current === end) break;
    unvisited.delete(current);

    const neighbors = edges.filter(
      (e) => e.from === current || e.to === current
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

/* ---------------- API ---------------- */
export async function POST(req: NextRequest) {
  try {
    const { hospitalId, floorId, startNodeId, endNodeId } = await req.json();

    const floor = await prisma.floor.findFirst({
      where: {
        hospitalId,
        OR: [{ level: Number(floorId) }, { id: floorId }]
      },
      select: { graphData: true }
    });

    if (!floor?.graphData) {
      return NextResponse.json({ error: "Map not found" }, { status: 404 });
    }

    const graph = floor.graphData as unknown as GraphData;

    const nodes = graph.pointsOfInterest.map((p) => p.nodeId);

    const edges: Edge[] = graph.routes.map((r) => ({
      from: r.from,
      to: r.to,
      weight: Number(r.distance) || 1
    }));

    const pathIds = dijkstra(nodes, edges, startNodeId, endNodeId);

    if (!pathIds) {
      return NextResponse.json({ error: "No path found" }, { status: 404 });
    }

    /* ✅ CONVERT NODE → COORDS */
    const path = pathIds.map((id) => {
      const p = graph.pointsOfInterest.find((poi) => poi.nodeId === id);
      return {
        nodeId: id,
        x: Number(p?.x) || 0,
        y: Number(p?.y) || 0
      };
    });

    /* ✅ TOTAL DISTANCE */
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += Math.hypot(
        path[i + 1].x - path[i].x,
        path[i + 1].y - path[i].y
      );
    }

    return NextResponse.json({
      path,
      distance: totalDistance
    });

  } catch (err) {
    console.error("Navigation Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
