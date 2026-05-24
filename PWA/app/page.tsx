'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LiveLocation } from '../../components/LiveLocation';
import { MapNode } from '../../lib/types';

function NavigationRuntime() {
  const searchParams = useSearchParams();
  const floorId = searchParams.get('floorId');
  const startNodeId = searchParams.get('startNodeId');
  const endNodeId = searchParams.get('endNodeId');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Position coordinates state loop
  const [userPos, setUserPos] = useState({ x: 0, y: 0 });
  const [heading, setHeading] = useState<number>(0);
  const [activePath, setActivePath] = useState<MapNode[]>([]);

  useEffect(() => {
    async function fetchNavigationRoute() {
      if (!floorId || !startNodeId || !endNodeId) {
        // Fallback default mock parameters to keep the layout active if search variables are missing
        const fallbackPath: MapNode[] = [
          { id: 'start_node', type: 'intersection', x: 20, y: 80 },
          { id: 'turn_1', type: 'corridor', x: 20, y: 40 },
          { id: 'turn_2', type: 'corridor', x: 70, y: 40 },
          { id: 'destination', type: 'room', x: 70, y: 15, name: 'Main Ward Emergency Room' }
        ];
        setActivePath(fallbackPath);
        setUserPos({ x: fallbackPath[0].x, y: fallbackPath[0].y });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        const response = await fetch(
          `${backendBase}/api/navigation/shortest-path?floorId=${floorId}&startNodeId=${startNodeId}&endNodeId=${endNodeId}`
        );
        const data = await response.json();

        if (data.success && data.path && data.path.length > 0) {
          setActivePath(data.path);
          setUserPos({ x: data.path[0].x, y: data.path[0].y });
          setErrorMessage(null);
        } else {
          setErrorMessage(data.error || 'Failed to resolve continuous pathway logic.');
        }
      } catch (err) {
        console.error("Navigation API retrieval crash:", err);
        setErrorMessage('Failed to connect to backend routing service.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNavigationRoute();
  }, [floorId, startNodeId, endNodeId]);

  const targetDestination = activePath[activePath.length - 1];
  const polylinePoints = activePath.map((node) => `${node.x},${node.y}`).join(' ');

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full bg-slate-950 items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Calculating continuous corridor path routes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      {/* Upper Direction Header bar */}
      <div className="p-5 bg-slate-900 border-b border-slate-800 shadow-xl z-10">
        <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Live Tracking Route</span>
        <h1 className="text-xl font-extrabold truncate mt-0.5">
          {errorMessage ? 'Routing Error' : (targetDestination?.name || 'Hospital Location Point')}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {errorMessage ? errorMessage : 'Continuous pathlines draw automatically. Follow alignment arrow indicator.'}
        </p>
      </div>

      {/* Vector Tracking Layer Space */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-4">
        {/* Dynamic Plain Map Color Canvas Container */}
        <div className="w-full max-w-md aspect-square bg-slate-900 rounded-2xl shadow-2xl relative border border-slate-800 overflow-hidden">
          
          <svg 
            className="w-full h-full absolute inset-0 select-none" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            {/* Background Structural Mesh Lines */}
            <defs>
              <pattern id="canvas-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.15" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#canvas-grid)" />

            {/* 1. CONTINUOUS CORRIDOR drawn path tracks */}
            {activePath.length > 1 && (
              <>
                {/* Radiant lower blur line track */}
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-25"
                />
                {/* Solid vector path tracking pipeline */}
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* 2. ROUTE CHECKPOINT MAP PLOTS */}
            {activePath.map((node, index) => {
              if (index === 0 || index === activePath.length - 1) return null;
              return (
                <circle
                  key={node.id || index}
                  cx={node.x}
                  cy={node.y}
                  r="0.8"
                  className="fill-slate-800 stroke-blue-500 stroke-[0.3]"
                />
              );
            })}

            {/* 3. TARGET LOCATION ENDPOINT ARROW PIN */}
            {targetDestination && (
              <g transform={`translate(${targetDestination.x}, ${targetDestination.y})`}>
                <circle r="3.5" className="fill-emerald-500/30 animate-pulse" />
                <circle r="1.5" className="fill-emerald-500 stroke-slate-900 stroke-[0.4]" />
              </g>
            )}

            {/* 4. PHYSICAL DEVICE tracking node + field cone */}
            <g transform={`translate(${userPos.x}, ${userPos.y})`}>
              {/* Telemetry pulse glow rings */}
              <circle r="4.5" className="fill-blue-500/20 animate-ping" />
              
              {/* Direction compass projection triangle */}
              <path
                d="M 0 0 L -1.8 -4.5 A 4.5 4.5 0 0 1 1.8 -4.5 Z"
                className="fill-blue-400/60 transition-transform duration-75 ease-out"
                transform={`rotate(${heading})`}
              />
              
              {/* Telemetry anchor base beacon point */}
              <circle r="1.2" className="fill-blue-500 stroke-white stroke-[0.35] shadow-lg" />
            </g>
          </svg>

          {/* Integrated Device Telemetry Thread Link */}
          {activePath.length > 0 && (
            <LiveLocation
              initialX={activePath[0].x}
              initialY={activePath[0].y}
              activePath={activePath}
              onPositionUpdate={(pos) => setUserPos(pos)}
              heading={heading}
              setHeading={setHeading}
            />
          )}
        </div>
      </div>

      {/* Footer Tracking Operations Drawer */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 text-center flex gap-3 justify-center">
        <button 
          onClick={() => {
            if (activePath.length > 0) {
              setUserPos({ x: activePath[0].x, y: activePath[0].y });
            }
          }}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold rounded-xl border border-slate-700 transition"
        >
          Recalibrate to Anchor QR
        </button>
      </div>
    </div>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full bg-slate-950 items-center justify-center text-white text-sm">
        Initializing spatial navigation maps...
      </div>
    }>
      <NavigationRuntime />
    </Suspense>
  );
}
