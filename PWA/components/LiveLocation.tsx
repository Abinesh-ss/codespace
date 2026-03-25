"use client";
import { useEffect, useState } from "react";

export default function LiveLocation() {
  const [pos, setPos] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      p => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  if (!pos) return <span className="text-xs text-slate-500">GPS...</span>;

  return (
    <span className="text-xs text-slate-400">
      📍 {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
    </span>
  );
}
