import { Anchor } from "./types";

export function calculatePosition(anchor: Anchor) {
  return {
    floor: anchor.floor,
    x: anchor.x,
    y: anchor.y
  };
}