"use client";

import React from "react";

export interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  type?: string;
  floor?: string;
}

export interface MapOverlayProps {
  // New standard props
  mapImageUrl?: string;
  imageDimensions?: { width: number; height: number };
  nodes?: Node[];
  path?: Array<{ x: number; y: number }>;
  userLocation?: { x: number; y: number } | null;
  destination?: Node | null;

  // Legacy prop aliases (for compatibility with app/navigate/page.tsx)
  poiList?: Node[];
  userPos?: { x: number; y: number } | null;
  targetPos?: { x: number; y: number } | null;
  floorMapUrl?: string;
  rotation?: number;
}

export default function MapOverlay({
  mapImageUrl,
  imageDimensions = { width: 1000, height: 1000 },
  nodes,
  path = [],
  userLocation,
  destination,
  
  // Legacy aliases
  poiList,
  userPos,
  targetPos,
  floorMapUrl,
  rotation = 0,
}: MapOverlayProps) {
  // Resolve unified values (preferring primary props over legacy props)
  const activeImageUrl = mapImageUrl || floorMapUrl || "/uploads/floorplan-default.png";
  const activeNodes = nodes || poiList || [];
  const activeUserLoc = userLocation !== undefined ? userLocation : userPos;
  
  const { width, height } = imageDimensions;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-950">
      <div 
        className="w-full h-full flex items-center justify-center transition-transform duration-300"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full object-contain select-none"
        >
          {/* LAYER 1: Uploaded Floor Plan Image Background */}
          {activeImageUrl && (
            <image
              href={activeImageUrl}
              x="0"
              y="0"
              width={width}
              height={height}
              preserveAspectRatio="xMidYMid meet"
              opacity={0.85}
            />
          )}

          {/* LAYER 2: Grid Guide Overlay */}
          <defs>
            <pattern
              id="mapGrid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#mapGrid)" />

          {/* LAYER 3: Calculated Navigation Path Line */}
          {path.length > 1 && (
            <>
              <polyline
                points={path.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="10"
                strokeOpacity="0.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={path.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#60A5FA"
                strokeWidth="5"
                strokeDasharray="8 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* LAYER 4: POI Destination Nodes */}
          {activeNodes.map((node) => {
            const isSelectedTarget =
              destination?.id === node.id ||
              (targetPos && targetPos.x === node.x && targetPos.y === node.y);

            return (
              <g
                key={node.id || `${node.x}-${node.y}`}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer transition-transform duration-200"
              >
                <circle
                  r={isSelectedTarget ? "10" : "6"}
                  fill={isSelectedTarget ? "#EF4444" : "#3B82F6"}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                {isSelectedTarget && (
                  <circle
                    r="18"
                    fill="#EF4444"
                    opacity="0.3"
                    className="animate-ping"
                  />
                )}

                <text
                  y="-14"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="12"
                  fontWeight="600"
                  className="drop-shadow-md pointer-events-none"
                >
                  {node.name}
                </text>
              </g>
            );
          })}

          {/* LAYER 5: Live User Position Marker */}
          {activeUserLoc && (
            <g transform={`translate(${activeUserLoc.x}, ${activeUserLoc.y})`}>
              <circle
                r="18"
                fill="#22C55E"
                opacity="0.3"
                className="animate-ping"
              />
              <circle
                r="9"
                fill="#22C55E"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              <circle r="3" fill="#FFFFFF" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
