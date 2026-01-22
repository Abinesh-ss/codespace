"use client";

import { useEffect, useState } from "react";

interface FloorDetectorProps {
  onFloor: (floor: number) => void;
  defaultFloor?: number; // optional fallback
}

export default function FloorDetector({ onFloor, defaultFloor = 1 }: FloorDetectorProps) {
  const [currentFloor, setCurrentFloor] = useState<number>(defaultFloor);

  useEffect(() => {
    const saved = localStorage.getItem("floor");
    if (saved) {
      const f = Number(saved);
      setCurrentFloor(f);
      onFloor(f);
    } else {
      localStorage.setItem("floor", defaultFloor.toString());
      onFloor(defaultFloor);
    }
  }, [defaultFloor, onFloor]);

  // ✅ Optional: allow dynamic floor switching via JS
  const switchFloor = (floor: number) => {
    setCurrentFloor(floor);
    localStorage.setItem("floor", floor.toString());
    onFloor(floor);
  };

  return null; // still invisible in UI
}

