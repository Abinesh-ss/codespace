"use client";
import { useEffect } from "react";

export default function FloorDetector({ onFloor }: { onFloor: (f: number) => void }) {
  useEffect(() => {
    const saved = localStorage.getItem("floor");
    if (saved) onFloor(Number(saved));
  }, []);

  return null;
}