"use client";
import { useEffect, useState } from "react";

export default function Compass() {
  const [angle, setAngle] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) setAngle(e.alpha);
    };
    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  return <p>Heading: {angle?.toFixed(1)}°</p>;
}