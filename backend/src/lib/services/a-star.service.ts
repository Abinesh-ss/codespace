import { Graph, Node, PathResult } from '@/types';

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
