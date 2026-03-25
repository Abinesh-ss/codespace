"use client";

import { useMemo, useEffect, useState } from "react";

interface MapOverlayProps {
  poiList: any[];
  userPos: { x: number; y: number } | null;
  targetPos?: { x: number; y: number };
  path: { x: number; y: number }[];
  rotation: number;
}

export default function MapOverlay({
  poiList,
  userPos,
  targetPos,
  path,
  rotation
}: MapOverlayProps) {
  const [smoothUserPos, setSmoothUserPos] = useState({ x: userPos?.x || 0, y: userPos?.y || 0 });

  // 1. DYNAMIC VIEWBOX CALCULATION
  // This ensures the map scales to fit your specific hospital data
  const viewBox = useMemo(() => {
    if (!poiList.length) return "0 0 1000 1000";
    
    const padding = 100;
    const xs = poiList.map(p => p.x);
    const ys = poiList.map(p => p.y);
    
    const minX = Math.min(...xs) - padding;
    const minY = Math.min(...ys) - padding;
    const maxX = Math.max(...xs) + padding;
    const maxY = Math.max(...ys) + padding;
    
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [poiList]);

  const currentIndex = useMemo(() => {
    if (!userPos || path.length === 0) return 0;
    let closestIndex = 0;
    let minDist = Infinity;
    path.forEach((p, i) => {
      const dist = Math.hypot(p.x - userPos.x, p.y - userPos.y);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    });
    return closestIndex;
  }, [userPos, path]);

  useEffect(() => {
    if (userPos) setSmoothUserPos(userPos);
  }, [userPos]);

  const completedPath = path.slice(0, currentIndex + 1);
  const remainingPath = path.slice(currentIndex);

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden flex items-center justify-center">
      {/* GRID LAYER */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#3b82f6 0.5px, transparent 0.5px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* MAP ROTATION & CAMERA LAYER */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center"
        style={{
          transform: `rotate(${-rotation}deg)`,
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        <svg
          viewBox={viewBox} 
          className="w-[90%] h-[90%]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* PATHS */}
          {completedPath.length > 1 && (
            <polyline
              points={completedPath.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#475569"
              strokeWidth="6"
              strokeDasharray="12,12"
            />
          )}

          {remainingPath.length > 1 && (
            <>
              <polyline
                points={remainingPath.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="30"
                opacity="0.1"
                strokeLinecap="round"
              />
              <polyline
                points={remainingPath.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* ROOM LABELS */}
          {poiList?.map((poi) => (
            <g key={poi.id}>
              <circle cx={poi.x} cy={poi.y} r="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
              <text 
                x={poi.x} 
                y={poi.y + 25} 
                fontSize="16" 
                fill="#94a3b8" 
                textAnchor="middle" 
                className="font-bold pointer-events-none"
                style={{ 
                  // This keeps labels upright even when the map rotates!
                  transform: `rotate(${rotation}deg)`, 
                  transformOrigin: `${poi.x}px ${poi.y}px`,
                  transition: "transform 0.4s"
                }}
              >
                {poi.name}
              </text>
            </g>
          ))}

          {/* USER POSITION (The Blue Dot) */}
          {userPos && (
            <g 
              transform={`translate(${smoothUserPos.x}, ${smoothUserPos.y})`}
              style={{ transition: "transform 0.5s ease-out" }}
            >
              <circle r="40" fill="#3b82f6" className="opacity-20 animate-ping" />
              <circle r="15" fill="#3b82f6" stroke="white" strokeWidth="4" />
              {/* Directional Beak */}
              <path d="M-10 -12 L0 -25 L10 -12 Z" fill="white" />
            </g>
          )}

          {/* DESTINATION */}
          {targetPos && (
            <g transform={`translate(${targetPos.x}, ${targetPos.y})`}>
              <path 
                d="M0 0 L-15 -40 A15 15 0 1 1 15 -40 Z" 
                fill="#ef4444" 
                stroke="white" 
                strokeWidth="3"
              />
            </g>
          )}
        </svg>
      </div>

      {/* INFO PILLS */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-50">
        <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-[10px] text-blue-400 font-bold backdrop-blur-md">
          FLOOR {poiList[0]?.floorId?.slice(-4).toUpperCase() || '0'}
        </div>
        {path.length > 0 && (
           <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[10px] text-emerald-400 font-bold backdrop-blur-md uppercase">
            Navigation Active
           </div>
        )}
      </div>
    </div>
  );
}
