"use client";

import React, { useState, useRef, useMemo } from "react";
import { Move, Navigation, Plus, Trash2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface POI {
  id: string;
  nodeId: string;
  name: string;
  floorId: string | number;
  x: number;
  y: number;
  category?: string;
}

interface Route {
  id: string;
  from: string; // matches POI nodeId
  to: string;   // matches POI nodeId
  floorId?: string | number;
}

interface MapEditorProps {
  initialPOIs?: POI[];
  initialRoutes?: Route[];
  activeFloor: string | number;
}

export default function MapEditor({
  initialPOIs = [],
  initialRoutes = [],
  activeFloor = "1",
}: MapEditorProps) {
  const [pointsOfInterest, setPointsOfInterest] = useState<POI[]>(initialPOIs);
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  
  // Editor View Controls
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<"select" | "poi" | "route">("select");
  
  // Selection State
  const [selectedPOI, setSelectedPOI] = useState<string | null>(null);
  const [routeStartNode, setRouteStartNode] = useState<string | null>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Filtered POIs for current active floor
  const visiblePOIs = useMemo(() => {
    return pointsOfInterest.filter((p) => String(p.floorId) === String(activeFloor));
  }, [pointsOfInterest, activeFloor]);

  // Filtered Routes where BOTH connected POIs exist on the current active floor
  const visibleRoutes = useMemo(() => {
    return routes.filter((route) => {
      const fromPOI = pointsOfInterest.find((p) => p.nodeId === route.from);
      const toPOI = pointsOfInterest.find((p) => p.nodeId === route.to);
      
      if (!fromPOI || !toPOI) return false;
      
      // If floorId is explicitly on route, check it; otherwise ensure both nodes belong to active floor
      if (route.floorId !== undefined) {
        return String(route.floorId) === String(activeFloor);
      }
      return String(fromPOI.floorId) === String(activeFloor) && String(toPOI.floorId) === String(activeFloor);
    });
  }, [routes, pointsOfInterest, activeFloor]);

  // Convert Screen Clicks to Canvas Coordinates (Accounting for Scale & Rotation)
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dx = clickX - offset.x;
    const dy = clickY - offset.y;

    const rad = (-rotation * Math.PI) / 180;
    const rotX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const rotY = dx * Math.sin(rad) + dy * Math.cos(rad);

    return {
      x: Math.round(rotX / scale),
      y: Math.round(rotY / scale),
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingCanvas) return;

    const { x, y } = getCanvasCoordinates(e);

    if (activeTool === "poi") {
      const newPOI: POI = {
        id: `poi_${Date.now()}`,
        nodeId: `node_${Math.random().toString(36).substring(2, 7)}`,
        name: `Point ${pointsOfInterest.length + 1}`,
        floorId: activeFloor,
        x,
        y,
      };
      setPointsOfInterest((prev) => [...prev, newPOI]);
      setSelectedPOI(newPOI.id);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, poi: POI) => {
    e.stopPropagation();

    if (activeTool === "route") {
      if (!routeStartNode) {
        setRouteStartNode(poi.nodeId);
      } else if (routeStartNode !== poi.nodeId) {
        const newRoute: Route = {
          id: `route_${Date.now()}`,
          from: routeStartNode,
          to: poi.nodeId,
          floorId: activeFloor,
        };
        setRoutes((prev) => [...prev, newRoute]);
        setRouteStartNode(null);
      }
    } else {
      setSelectedPOI(poi.id);
    }
  };

  // Pan Canvas Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (activeTool === "select" || e.spaceKey)) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const deletePOI = (id: string) => {
    const poiToDelete = pointsOfInterest.find((p) => p.id === id);
    if (!poiToDelete) return;

    setPointsOfInterest((prev) => prev.filter((p) => p.id !== id));
    setRoutes((prev) =>
      prev.filter((r) => r.from !== poiToDelete.nodeId && r.to !== poiToDelete.nodeId)
    );
    if (selectedPOI === id) setSelectedPOI(null);
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 cursor-crosshair overflow-hidden select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Transform Group */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: "top left",
          }}
        >
          {/* SVG Overlay Layer for Routes */}
          <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-10">
            {visibleRoutes.map((route) => {
              const from = pointsOfInterest.find((p) => p.nodeId === route.from);
              const to = pointsOfInterest.find((p) => p.nodeId === route.to);

              if (!from || !to) return null;

              return (
                <line
                  key={route.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#3b82f6"
                  strokeWidth={3 / scale}
                  strokeDasharray="6,6"
                />
              );
            })}
          </svg>

          {/* POI Render Layer */}
          {visiblePOIs.map((poi) => {
            const isSelected = selectedPOI === poi.id;
            const isRouteSource = routeStartNode === poi.nodeId;

            return (
              <div
                key={poi.id}
                onClick={(e) => handleNodeClick(e, poi)}
                style={{
                  left: `${poi.x}px`,
                  top: `${poi.y}px`,
                  transform: `translate(-50%, -50%) scale(${1 / scale})`,
                }}
                className={`absolute z-20 flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-transform ${
                  isRouteSource
                    ? "bg-amber-500 ring-4 ring-amber-300"
                    : isSelected
                    ? "bg-emerald-500 ring-4 ring-emerald-300"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                <span className="text-[10px] font-bold text-white pointer-events-none">
                  {poi.name.substring(0, 2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Toolbar Controls */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-slate-800/90 border border-slate-700 p-1.5 rounded-lg backdrop-blur">
          <button
            onClick={() => setActiveTool("select")}
            className={`p-2 rounded ${activeTool === "select" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            title="Select / Pan"
          >
            <Move size={18} />
          </button>
          <button
            onClick={() => setActiveTool("poi")}
            className={`p-2 rounded ${activeTool === "poi" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            title="Add POI"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => setActiveTool("route")}
            className={`p-2 rounded ${activeTool === "route" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            title="Connect Route"
          >
            <Navigation size={18} />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            onClick={() => setScale((s) => Math.min(s + 0.2, 5))}
            className="p-2 text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.2))}
            className="p-2 text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-2 text-slate-400 hover:text-white"
            title="Rotate View"
          >
            <RotateCw size={18} />
          </button>
        </div>
      </div>

      {/* Sidebar - Render Filtered Floor Nodes */}
      <div className="w-80 border-l border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-4 z-30">
        <h2 className="text-lg font-semibold text-slate-200">
          Floor {activeFloor} Nodes ({visiblePOIs.length})
        </h2>

        <div className="flex-1 overflow-y-auto space-y-2">
          {visiblePOIs.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No POIs added on this floor yet.</p>
          ) : (
            visiblePOIs.map((poi) => (
              <div
                key={poi.id}
                onClick={() => setSelectedPOI(poi.id)}
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                  selectedPOI === poi.id
                    ? "bg-slate-800 border-blue-500"
                    : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">{poi.name}</p>
                  <p className="text-xs text-slate-400">
                    X: {poi.x} | Y: {poi.y}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePOI(poi.id);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
