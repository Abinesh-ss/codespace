import { MapNode, MapEdge } from '../../../../PWA/lib/types';

interface GraphJson {
  nodes?: MapNode[];
  edges?: MapEdge[];
  pointsOfInterest?: any[];
}

export class AStarService {
  /**
   * Primary weight calculation heuristic: Straight-line physical Euclidean distance
   */
  private static getDistance(n1: MapNode, n2: MapNode): number {
    return Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
  }

  /**
   * Solves shortest path routing map using structural matrix arrays
   */
  public static calculatePath(graphData: any, startNodeId: string, endNodeId: string): MapNode[] {
    const graph = graphData as GraphJson;
    const nodes = graph.nodes || [];
    const edges = graph.edges || [];

    // Map out matching cross-references for POI nodes if nodeId is hidden inside pointsOfInterest array
    const pois = graph.pointsOfInterest || [];
    const mergedNodes: MapNode[] = [...nodes];
    
    pois.forEach((poi) => {
      if (poi.nodeId && !mergedNodes.some(n => n.id === poi.nodeId)) {
        mergedNodes.push({
          id: poi.nodeId,
          type: poi.type || 'room',
          x: poi.x,
          y: poi.y,
          name: poi.name
        });
      }
    });

    const startNode = mergedNodes.find((n) => n.id === startNodeId);
    const endNode = mergedNodes.find((n) => n.id === endNodeId);

    if (!startNode || !endNode) {
      console.warn(`A* Routing aborting: Start node (${startNodeId}) or End node (${endNodeId}) missing in floor data graph.`);
      return [];
    }

    const openSet: string[] = [startNode.id];
    const cameFrom: Record<string, string> = {};

    const gScore: Record<string, number> = {};
    const fScore: Record<string, number> = {};

    mergedNodes.forEach((n) => {
      gScore[n.id] = Infinity;
      fScore[n.id] = Infinity;
    });

    gScore[startNode.id] = 0;
    fScore[startNode.id] = this.getDistance(startNode, endNode);

    while (openSet.length > 0) {
      // Find node with lowest predicted path line value
      let currentId = openSet[0];
      let lowestF = fScore[currentId];

      for (let i = 1; i < openSet.length; i++) {
        const id = openSet[i];
        if (fScore[id] < lowestF) {
          lowestF = fScore[id];
          currentId = id;
        }
      }

      if (currentId === endNode.id) {
        // Build the physical structured sequential corridor nodes
        const path: MapNode[] = [];
        let curr: string | undefined = currentId;
        while (curr) {
          const matchNode = mergedNodes.find((n) => n.id === curr);
          if (matchNode) path.unshift(matchNode);
          curr = cameFrom[curr];
        }
        return path;
      }

      // Evict current node from evaluation array
      const idx = openSet.indexOf(currentId);
      if (idx > -1) openSet.splice(idx, 1);

      // Evaluate edge routes that originate from or terminate at the current checkpoint
      const neighbors = edges
        .filter((e) => e.fromNodeId === currentId || e.toNodeId === currentId)
        .map((e) => (e.fromNodeId === currentId ? e.toNodeId : e.fromNodeId));

      for (const neighborId of neighbors) {
        const neighborNode = mergedNodes.find((n) => n.id === neighborId);
        if (!neighborNode) continue;

        const edgeWeight = edges.find(
          (e) =>
            (e.fromNodeId === currentId && e.toNodeId === neighborId) ||
            (e.fromNodeId === neighborId && e.toNodeId === currentId)
        )?.distance || this.getDistance(mergedNodes.find(n => n.id === currentId)!, neighborNode);

        const tentativeGScore = gScore[currentId] + edgeWeight;

        if (tentativeGScore < gScore[neighborId]) {
          cameFrom[neighborId] = currentId;
          gScore[neighborId] = tentativeGScore;
          fScore[neighborId] = tentativeGScore + this.getDistance(neighborNode, endNode);

          if (!openSet.includes(neighborId)) {
            openSet.push(neighborId);
          }
        }
      }
    }

    return []; // No viable continuous connection pathway exists
  }
}import { Graph, Node, PathResult } from '@/types';

class PriorityQueue<T> {
  private items: { item: T; priority: number }[] = [];

  enqueue(item: T, priority: number) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * Heuristic function using Euclidean distance + a heavy penalty for floor changes
 * to encourage staying on the same floor unless necessary.
 */
function heuristic(node1: Node, node2: Node): number {
  const dx = node1.x - node2.x;
  const dy = node1.y - node2.y;
  // Large penalty for floor differences (50 units per floor)
  const floorPenalty = Math.abs(node1.floor - node2.floor) * 50;
  return Math.sqrt(dx * dx + dy * dy) + floorPenalty;
}

/**
 * Calculates the shortest path between two points in the hospital graph.
 */
export function calculateAStarPath(
  graph: Graph,
  startId: string,
  endId: string
): PathResult {
  const startNode = graph.nodes.find(n => n.id === startId);
  const endNode = graph.nodes.find(n => n.id === endId);

  if (!startNode || !endNode) {
    throw new Error('Start or end node not found in the hospital database.');
  }

  const openSet = new PriorityQueue<string>();
  const cameFrom = new Map<string, string>();
  
  // gScore[n] is the cost of the cheapest path from start to n currently known.
  const gScore = new Map<string, number>();
  // fScore[n] = gScore[n] + heuristic(n, endNode).
  const fScore = new Map<string, number>();

  graph.nodes.forEach(node => {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  });

  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startNode, endNode));
  openSet.enqueue(startId, fScore.get(startId)!);

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()!;

    if (current === endId) {
      return reconstructPath(cameFrom, current, graph);
    }

    const currentNode = graph.nodes.find(n => n.id === current);
    if (!currentNode) continue;

    // Filter edges connected to the current node
    const neighbors = graph.edges
      .filter(e => e.from === current)
      .map(e => ({ id: e.to, distance: e.distance, type: e.type }));

    for (const neighbor of neighbors) {
      const tentativeGScore = gScore.get(current)! + neighbor.distance;

      if (tentativeGScore < gScore.get(neighbor.id)!) {
        cameFrom.set(neighbor.id, current);
        gScore.set(neighbor.id, tentativeGScore);
        
        const neighborNode = graph.nodes.find(n => n.id === neighbor.id);
        if (neighborNode) {
          const h = heuristic(neighborNode, endNode);
          fScore.set(neighbor.id, tentativeGScore + h);
          openSet.enqueue(neighbor.id, fScore.get(neighbor.id)!);
        }
      }
    }
  }

  throw new Error('No valid path found between these two locations.');
}

/**
 * Reconstructs the node-by-node path and generates human-readable instructions.
 */
function reconstructPath(
  cameFrom: Map<string, string>,
  current: string,
  graph: Graph
): PathResult {
  const path: string[] = [current];
  let totalDistance = 0;
  const instructions: string[] = [];

  while (cameFrom.has(current)) {
    const prev = cameFrom.get(current)!;
    const edge = graph.edges.find(e => e.from === prev && e.to === current);
    const prevNode = graph.nodes.find(n => n.id === prev);
    const currentNode = graph.nodes.find(n => n.id === current);
    
    if (edge && currentNode) {
      totalDistance += edge.distance;
      
      // Determine movement type for instruction generation
      if (edge.type === 'elevator') {
        instructions.push(`Take elevator to floor ${currentNode.floor}`);
      } else if (edge.type === 'stairs') {
        instructions.push(`Take stairs to floor ${currentNode.floor}`);
      } else if (prevNode && prevNode.floor !== currentNode.floor) {
        // Fallback for floor changes not explicitly marked as stairs/elevator
        instructions.push(`Proceed to floor ${currentNode.floor}`);
      } else {
        instructions.push(`Walk straight for ${edge.distance.toFixed(1)}m`);
      }
    }
    
    path.unshift(prev);
    current = prev;
  }

  return {
    path,
    distance: Number(totalDistance.toFixed(2)),
    instructions: instructions.reverse() // Reverse to show instructions from START to END
  };
}
