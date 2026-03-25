"use client";

import { useEffect, useRef } from "react";

interface FloorDetectorProps {
  onFloor: (floor: number) => void;
  defaultFloor?: number;
}

export default function FloorDetector({ onFloor, defaultFloor = 0 }: FloorDetectorProps) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current || typeof window === "undefined") return;

    const initializeFloor = () => {
      let numericFloor = defaultFloor;

      try {
        const saved = window.localStorage.getItem("floor");
        if (saved !== null && !isNaN(Number(saved))) {
          numericFloor = Number(saved);
        }
        window.localStorage.setItem("floor", numericFloor.toString());
      } catch (e) {
        console.warn("Storage blocked, defaulting to floor:", defaultFloor);
      }

      // Small timeout ensures the rest of the app's providers 
      // (like Map or Location) are ready before we trigger the fetch
      setTimeout(() => {
        onFloor(numericFloor);
      }, 100); 
      
      hasInitialized.current = true;
    };

    initializeFloor();
  }, [defaultFloor, onFloor]);

  return null;
}
