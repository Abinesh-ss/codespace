import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/* ---------------- UPDATED TYPES ---------------- */

type GraphPOI = {
  nodeId: string
  x: number
  y: number
  name?: string
}

type GraphRoute = {
  from: string
  to: string
  distance: number // Map this to 'weight' for Dijkstra
}

type GraphData = {
  pointsOfInterest: GraphPOI[]
  routes: GraphRoute[]
}

type GraphEdge = {
  from: string
  to: string
  weight: number
}

/* ---------------- HELPERS ---------------- */

function dijkstra(
  nodes: string[],
  edges: GraphEdge[],
  start: string,
  end: string
): string[] | null {
  const distances: Record<string, number> = {}
  const previous: Record<string, string | null> = {}
  const unvisited = new Set(nodes)

  nodes.forEach(n => {
    distances[n] = Infinity
    previous[n] = null
  })

  distances[start] = 0

  while (unvisited.size > 0) {
    const current = [...unvisited].reduce((a, b) =>
      distances[a] < distances[b] ? a : b
    )

    if (distances[current] === Infinity) break 
    if (current === end) break
    unvisited.delete(current)

    const neighbors = edges.filter(
      e => e.from === current || e.to === current
    )

    for (const edge of neighbors) {
      const neighbor = edge.from === current ? edge.to : edge.from
      if (!unvisited.has(neighbor)) continue

      const alt = distances[current] + (edge.weight ?? 1)
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt
        previous[neighbor] = current
      }
    }
  }

  const path: string[] = []
  let curr: string | null = end

  while (curr) {
    path.unshift(curr)
    curr = previous[curr]
  }

  return path[0] === start ? path : null
}

/* ---------------- ROUTE ---------------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("🧭 NAV PAYLOAD:", body)

    const { hospitalId, floorId, startNodeId, endNodeId } = body

    if (!hospitalId || !floorId || !startNodeId || !endNodeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    /* -------- FETCH FLOOR GRAPH -------- */

    const floor = await prisma.floor.findFirst({
      where: {
        hospitalId,
        level: Number(floorId)
      },
      select: {
        graphData: true
      }
    })

    if (!floor || !floor.graphData) {
      return NextResponse.json(
        { error: "Graph data not found for floor" },
        { status: 400 }
      )
    }

    // Cast the JSON to our updated GraphData structure
    const graph = floor.graphData as unknown as GraphData

    console.log("🧩 GRAPH EXTRACTED:", graph)

    /* -------- GRAPH VALIDATION -------- */

    if (
      !Array.isArray(graph.pointsOfInterest) ||
      !Array.isArray(graph.routes)
    ) {
      return NextResponse.json(
        { error: "Invalid graph structure in database" },
        { status: 400 }
      )
    }

    const nodeIds = graph.pointsOfInterest.map(p => p.nodeId)

    // Log check for debugging node existence
    if (!nodeIds.includes(startNodeId)) {
      console.error(`❌ Start node ${startNodeId} not found in graph nodes:`, nodeIds)
      return NextResponse.json({ error: "Start node not in graph" }, { status: 400 })
    }

    if (!nodeIds.includes(endNodeId)) {
      console.error(`❌ End node ${endNodeId} not found in graph nodes:`, nodeIds)
      return NextResponse.json({ error: "End node not in graph" }, { status: 400 })
    }

    /* -------- SHORTEST PATH -------- */

    // Map DB 'routes' to 'GraphEdge' format
    const edges: GraphEdge[] = graph.routes.map(r => ({
      from: r.from,
      to: r.to,
      weight: r.distance || 1
    }))

    const path = dijkstra(
      nodeIds,
      edges,
      startNodeId,
      endNodeId
    )

    if (!path) {
      return NextResponse.json(
        { error: "No path found between nodes" },
        { status: 400 }
      )
    }

    /* -------- FETCH POI COORDINATES -------- */

    const pois = await prisma.poi.findMany({
      where: {
        nodeId: { in: path }
      },
      select: {
        nodeId: true,
        x: true,
        y: true
      }
    })

    const pathWithCoords = path.map(nodeId => {
      // First try to find in the POI table, fallback to the graphData JSON
      const poiRecord = pois.find(p => p.nodeId === nodeId)
      const graphPoi = graph.pointsOfInterest.find(p => p.nodeId === nodeId)
      
      return {
        nodeId,
        x: poiRecord?.x ?? graphPoi?.x ?? null,
        y: poiRecord?.y ?? graphPoi?.y ?? null
      }
    })

    return NextResponse.json({
      success: true,
      path: pathWithCoords
    })

  } catch (err) {
    console.error("❌ NAV ERROR:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
