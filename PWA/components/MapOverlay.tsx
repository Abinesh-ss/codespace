"use client";

import React from "react";

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  type?: string;
  floor?: string;
}

interface MapOverlayProps {
  mapImageUrl?: string;
  imageDimensions?: { width: number; height: number };
  nodes: Node[];
  path: Array<{ x: number; y: number }>;
  userLocation: { x: number; y: number } | null;
  destination?: Node | null;
}

export default function MapOverlay({
  mapImageUrl = "/uploads/floorplan-default.png",
  imageDimensions = { width: 1000, height: 1000 },
  nodes = [],
  path = [],
  userLocation = null,
  destination = null,
}: MapOverlayProps) {
  const { width, height } = imageDimensions;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-950">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full object-contain select-none"
      >
        {/* LAYER 1: Uploaded Floor Plan Image Background */}
        {mapImageUrl && (
          <image
            href={mapImageUrl}
            x="0"
            y="0"
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid meet"
            opacity={0.85}
          />
        )}

        {/* LAYER 2: Grid Guide Lines (Optional Background Overlay) */}
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

        {/* LAYER 3: Calculated Navigation Path Polyline */}
        {path.length > 1 && (
          <>
            {/* Path Glow Effect */}
            <polyline
              points={path.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="10"
              strokeOpacity="0.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Main Navigation Dash Path */}
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

        {/* LAYER 4: All POI Nodes & Labels */}
        {nodes.map((node) => {
          const isSelectedTarget = destination?.id === node.id;
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer transition-transform duration-200"
            >
              {/* POI Node Pin */}
              <circle
                r={isSelectedTarget ? "10" : "6"}
                fill={isSelectedTarget ? "#EF4444" : "#3B82F6"}
                stroke="#FFFFFF"
                strokeWidth="2"
              />

              {/* Selected Destination Pin Pulse Animation */}
              {isSelectedTarget && (
                <circle
                  r="18"
                  fill="#EF4444"
                  opacity="0.3"
                  className="animate-ping"
                />
              )}

              {/* Label Text */}
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

        {/* LAYER 5: Live User Position Pulsing Marker */}
        {userLocation && (
          <g transform={`translate(${userLocation.x}, ${userLocation.y})`}>
            {/* External Ping Indicator */}
            <circle
              r="18"
              fill="#22C55E"
              opacity="0.3"
              className="animate-ping"
            />
            {/* Solid Center Marker */}
            <circle
              r="9"
              fill="#22C55E"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            {/* Center Core */}
            <circle r="3" fill="#FFFFFF" />
          </g>
        )}
      </svg>
    </div>
  );
}
