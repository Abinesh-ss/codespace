"use client";
import { useEffect, useState } from "react";

export default function LiveLocation() {
  const [pos, setPos] = useState<any>(null);

  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      p => setPos(p.coords),
      e => console.error(e),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  if (!pos) return <p>Locating...</p>;
  return <p>Lat: {pos.latitude}, Lng: {pos.longitude}</p>;
}