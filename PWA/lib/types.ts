export interface MapNode {
  id: string; // Maps perfectly to your database nodeId
  type: 'room' | 'corridor' | 'intersection' | 'elevator' | 'stairs' | string;
  x: number;  // Fluid width coordinate percentage (0 to 100)
  y: number;  // Fluid height coordinate percentage (0 to 100)
  name?: string;
}

export interface MapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number;
}

export interface FloorGraph {
  nodes: MapNode[];
  edges: MapEdge[];
  pointsOfInterest?: Array<MapNode & { qrId: string; dbId: string }>;
}

export interface UserPosition {
  x: number;
  y: number;
}
