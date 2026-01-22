"use client";

import { useEffect, useRef, useState } from "react";

export default function Compass() {
  const [heading, setHeading] = useState<number | null>(null);
  const smoothHeading = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha == null) return;

      // Normalize 0–360
      const raw = (360 - e.alpha) % 360;

      // Smooth interpolation (low-pass filter)
      smoothHeading.current =
        smoothHeading.current +
        (raw - smoothHeading.current) * 0.08;

      setHeading(smoothHeading.current);
    };

    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Compass Dial */}
      <div className="relative w-6 h-6 rounded-full border border-white/30 flex items-center justify-center">
        {/* Needle */}
        <div
          className="absolute w-[2px] h-3 bg-red-500 rounded-full origin-bottom transition-transform duration-75 ease-linear"
          style={{
            transform: `rotate(${heading ?? 0}deg) translateY(-2px)`,
          }}
        />
      </div>

      {/* Heading number (NO degree symbol) */}
      <span className="text-xs text-slate-300 tabular-nums">
        {heading !== null ? Math.round(heading) : "--"}
      </span>
    </div>
  );
}

