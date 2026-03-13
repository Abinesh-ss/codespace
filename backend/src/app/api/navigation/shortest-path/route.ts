import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type GraphPOI = {
  nodeId: string;
  qrId?: string;
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

type GraphEdge = {
  from: string;
  to: string;
  weight: number;
};

function dijkstra(
  nodes: string[],
  edges: GraphEdge[],
  start: string,
  end: string
): string[] | null {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set(nodes);

  nodes.forEach((n) => {
    distances[n] = Infinity;
    previous[n] = null;
  });

  if (!unvisited.has(start) || !unvisited.has(end)) return null;

  distances[start] = 0;

  while (unvisited.size > 0) {
    const current = [...unvisited].reduce((a, b) =>
      distances[a] < distances[b] ? a : b
    );

    if (distances[current] === Infinity) break;
    if (current === end) break;

    unvisited.delete(current);

    const neighbors = edges.filter(
      (e) => e.from === current || e.to === current
    );

    for (const edge of neighbors) {
      const neighbor = edge.from === current ? edge.to : edge.from;
      if (!unvisited.has(neighbor)) continue;

      const alt = distances[current] + edge.weight;

      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    }
  }

  const path: string[] = [];
  let curr: string | null = end;

  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return path[0] === start ? path : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalId, floorId, startNodeId, endNodeId } = body;

    console.log("Navigation request:", body);

    if (!hospitalId || !floorId || !startNodeId || !endNodeId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const floor = await prisma.floor.findFirst({
      where: {
        hospitalId: hospitalId,
        level: Number(floorId),
      },
      select: {
        graphData: true,
      },
    });

    if (!floor || !floor.graphData) {
      return NextResponse.json(
        { error: "Map graph data not found for this floor" },
        { status: 400 }
      );
    }

    const graph = floor.graphData as unknown as GraphData;

    const resolveNode = (id: string) => {
      const poi = graph.pointsOfInterest.find(
        (p) => p.nodeId === id || p.qrId === id
      );
      return poi?.nodeId || null;
    };

    const start = resolveNode(startNodeId);
    const end = resolveNode(endNodeId);

    console.log("Resolved nodes:", { start, end });

    if (!start || !end) {
      return NextResponse.json(
        { error: "Invalid or outdated QR code or destination" },
        { status: 400 }
      );
    }

    const nodeIds = graph.pointsOfInterest.map((p) => p.nodeId);

    const edges: GraphEdge[] = graph.routes.map((r) => ({
      from: r.from,
      to: r.to,
      weight: r.distance || 1,
    }));

    const path = dijkstra(nodeIds, edges, start, end);

    if (!path) {
      return NextResponse.json(
        { error: "No path exists between these locations" },
        { status: 404 }
      );
    }

    const instructions = path.map((nodeId, index) => {
      const poi = graph.pointsOfInterest.find((p) => p.nodeId === nodeId);
      const name = poi?.name || "Corridor";

      if (index === 0) return `Start at ${name}`;
      if (index === path.length - 1) return `Arrive at ${name}`;
      return `Continue towards ${name}`;
    });

    return NextResponse.json({
      success: true,
      path,
      instructions,
    });
  } catch (error) {
    console.error("Navigation API Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
