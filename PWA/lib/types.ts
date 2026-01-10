export interface Anchor {
  id: string;
  floor: number;
  x: number; // Represents percentage (0-100)
  y: number; // Represents percentage (0-100)
  label?: string;
}

export interface RouteStep {
  instruction: string;
  direction: number; // Degrees: 0 for straight, -90 for left, 90 for right
}
