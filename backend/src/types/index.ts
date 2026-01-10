export interface Node {
  id: string;
  x: number;
  y: number;
  floor: number;
  type?: string;
}

export interface Edge {
  from: string;
  to: string;
  distance: number;
  type: 'walk' | 'elevator' | 'stairs';
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export interface PathResult {
  path: string[];
  distance: number;
  instructions: string[];
}

export interface UserWithCredits {
  id: string;
  email: string;
  planStatus: string;
  creditsRemaining: number;
}
