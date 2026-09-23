import { Anchor, MapNode, MapEdge, FloorGraph } from "./types";

/**
 * Calculates current user coordinates and floor based on scanned Anchor
 */
export function calculatePosition(
  anchor: Anchor,
  offset: { x: number; y: number } = { x: 0, y: 0 }
) {
  return {
    floor: anchor.floor,
    x: anchor.x + offset.x,
    y: anchor.y + offset.y,
  };
}

/**
 * Computes 2D Euclidean distance between two coordinate points
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Dijkstra's algorithm to compute the shortest path between start and target nodes
 */
export function findShortestPath(
  graph: FloorGraph,
  startNodeId: string,
  endNodeId: string
): { pathNodes: MapNode[]; pathCoords: { x: number; y: number }[]; totalDistance: number } {
  const { nodes = [], edges = [] } = graph;

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  // Map for fast node lookup
  const nodeMap = new Map<string, MapNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });

  if (!nodeMap.has(startNodeId) || !nodeMap.has(endNodeId)) {
    return { pathNodes: [], pathCoords: [], totalDistance: 0 };
  }

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    // Get unvisited node with smallest distance
    let currentId: string | null = null;
    let smallestDist = Infinity;

    unvisited.forEach((nodeId) => {
      if (distances[nodeId] < smallestDist) {
        smallestDist = distances[nodeId];
        currentId = nodeId;
      }
    });

    if (currentId === null || currentId === endNodeId || distances[currentId] === Infinity) {
      break;
    }

    unvisited.delete(currentId);

    // Find neighboring edges connected to current node
    const neighborEdges = edges.filter(
      (e) => e.fromNodeId === currentId || e.toNodeId === currentId
    );

    for (const edge of neighborEdges) {
      const neighborId = edge.fromNodeId === currentId ? edge.toNodeId : edge.fromNodeId;

      if (unvisited.has(neighborId)) {
        const alt = distances[currentId] + (edge.distance || 1);
        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
          previous[neighborId] = currentId;
        }
      }
    }
  }

  // Reconstruct path nodes
  const pathNodes: MapNode[] = [];
  let curr: string | null = endNodeId;

  while (curr) {
    const node = nodeMap.get(curr);
    if (node) pathNodes.unshift(node);
    curr = previous[curr];
  }

  // If path reconstruction failed to connect to startNodeId
  if (pathNodes.length === 0 || pathNodes[0].id !== startNodeId) {
    return { pathNodes: [], pathCoords: [], totalDistance: 0 };
  }

  const pathCoords = pathNodes.map((node) => ({ x: node.x, y: node.y }));
  const totalDistance = distances[endNodeId] === Infinity ? 0 : distances[endNodeId];

  return { pathNodes, pathCoords, totalDistance };
}

/**
 * Linearly interpolates between two points for smooth positioning movement
 */
export function interpolatePosition(
  start: { x: number; y: number },
  end: { x: number; y: number },
  progress: number // Value between 0.0 and 1.0
): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, progress));
  return {
    x: start.x + (end.x - start.x) * clamped,
    y: start.y + (end.y - start.y) * clamped,
  };
}
