'use client';

import React, { useState, useEffect } from 'react';

interface EditorNode {
  id: string;
  type: 'room' | 'corridor' | 'intersection' | 'elevator' | 'stairs';
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  name?: string;
}

interface EditorEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number;
}

export default function MapEditorPage() {
  const [nodes, setNodes] = useState<EditorNode[]>([]);
  const [edges, setEdges] = useState<EditorEdge[]>([]);
  const [selectedNodeType, setSelectedNodeType] = useState<'room' | 'corridor' | 'intersection'>('corridor');
  const [nodeName, setNodeName] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // You can tie these to your selected hospital and floor states
  const [hospitalId, setHospitalId] = useState('example-hospital-id');
  const [floorId, setFloorId] = useState('new-uuid-placeholder'); 
  const [isSaving, setIsSaving] = useState(false);

  // 1. Plot a Point on the Map Grid Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));

    const newNode: EditorNode = {
      id: `node_${Date.now()}`,
      type: selectedNodeType,
      x,
      y,
      name: selectedNodeType === 'room' ? nodeName || `Room ${nodes.length + 1}` : undefined
    };

    setNodes([...nodes, newNode]);
    setNodeName('');
  };

  // 2. Click two nodes sequentially to link them with a Corridor line
  const connectNodes = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const fromNode = nodes.find(n => n.id === fromId);
    const toNode = nodes.find(n => n.id === toId);
    if (!fromNode || !toNode) return;

    // Prevent duplicate edges
    const exist = edges.find(e => 
      (e.fromNodeId === fromId && e.toNodeId === toId) || 
      (e.fromNodeId === toId && e.toNodeId === fromId)
    );
    if (exist) return;

    // Calculate straight-line path weight distance automatically 
    const distance = parseFloat(Math.sqrt(Math.pow(fromNode.x - toNode.x, 2) + Math.pow(fromNode.y - toNode.y, 2)).toFixed(2));

    const newEdge: EditorEdge = {
      id: `edge_${Date.now()}`,
      fromNodeId: fromId,
      toNodeId: toId,
      distance
    };

    setEdges([...edges, newEdge]);
  };

  // 3. Clear selected nodes or reset canvas
  const clearCanvas = () => {
    if(confirm("Are you sure you want to clear your current drawing draft?")) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
    }
  };

  // 4. Save dynamic structural JSON map schema directly to the backend floor endpoint
  const saveMapToDatabase = async () => {
    if (nodes.length === 0) {
      alert("Please place some path nodes on your layout map before saving.");
      return;
    }

    try {
      setIsSaving(true);

      // Map dynamic destination elements to the pointsOfInterest layout expected by your schema
      const pointsOfInterest = nodes
        .filter(n => n.type === 'room')
        .map(n => ({
          nodeId: n.id,
          name: n.name || 'Unnamed Room',
          x: n.x,
          y: n.y,
          type: n.type
        }));

      // Combine into the dynamic JSON graph layout block
      const completeGraphData = {
        nodes,
        edges,
        pointsOfInterest
      };

      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      
      // Sends payload matching backend/src/app/api/hospital/floor/route.ts POST logic
      const response = await fetch(`${backendBase}/api/hospital/floor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospitalId: hospitalId,
          mapId: floorId,
          name: "Main Map Layout Blueprint",
          level: 1,
          graphData: completeGraphData 
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Indoor navigation blueprint successfully compiled and synced to database records!');
      } else {
        alert(`Error saving floor plan layout: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed uploading network structure schema:', err);
      alert('Network error communicating with map coordination cluster.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white flex flex-col gap-4 font-sans">
      {/* Top Banner Management controls */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold">Vector Navigation Map Editor</h1>
          <p className="text-xs text-slate-400 mt-1">
            Click on the canvas grid below to drop coordinates. Tap two points one after another to form direct walkable connections.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
          >
            Clear Grid
          </button>
          <button
            onClick={saveMapToDatabase}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-900/20"
          >
            {isSaving ? 'Compiling Layout...' : 'Save Vector Blueprint'}
          </button>
        </div>
      </div>

      {/* Grid Configuration Options */}
      <div className="flex gap-4 items-center bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Tool Mode:</span>
          <select
            value={selectedNodeType}
            onChange={(e: any) => setSelectedNodeType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded p-1.5 outline-none text-blue-400 font-medium"
          >
            <option value="corridor">Hallway Node (Corridor)</option>
            <option value="intersection">Intersection Turn Corner</option>
            <option value="room">Patient Room (Destination Destination)</option>
          </select>
        </div>

        {selectedNodeType === 'room' && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="font-semibold text-slate-300">Target Name:</span>
            <input
              type="text"
              placeholder="e.g., ICU, Room 104, Lab"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded p-1.5 text-white outline-none w-52 focus:border-blue-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Canvas Workspace View container (Plain background context) */}
      <div className="flex-1 relative bg-slate-900 rounded-2xl border border-slate-800 h-[65vh] overflow-hidden shadow-inner">
        <div 
          onClick={handleCanvasClick}
          className="absolute inset-0 cursor-crosshair"
          style={{ 
            backgroundSize: '24px 24px', 
            backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)' 
          }}
        >
          {/* SVG Connector Corridor overlay layer */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {edges.map((edge) => {
              const fromNode = nodes.find(n => n.id === edge.fromNodeId);
              const toNode = nodes.find(n => n.id === edge.toNodeId);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={edge.id}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#2563eb"
                  strokeWidth="0.5"
                  strokeDasharray="1,1"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Individual Point Interactivity Handlers */}
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation(); // Stops adding a new point immediately on top of this one
                if (selectedNodeId && selectedNodeId !== node.id) {
                  connectNodes(selectedNodeId, node.id);
                  setSelectedNodeId(null);
                } else {
                  setSelectedNodeId(node.id);
                }
              }}
              className={`absolute w-3.5 h-3.5 -ml-1.75 -mt-1.75 rounded-full cursor-pointer transition-transform hover:scale-125 border shadow ${
                selectedNodeId === node.id 
                  ? 'bg-yellow-400 border-white ring-4 ring-yellow-400/30' 
                  : node.type === 'room' 
                    ? 'bg-emerald-500 border-slate-950' 
                    : node.type === 'intersection'
                      ? 'bg-purple-500 border-slate-950'
                      : 'bg-blue-500 border-slate-950'
              }`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              {/* Point Title Labels tooltip style */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-slate-950 text-white text-[10px] p-1 rounded border border-slate-700 pointer-events-none z-10">
                {node.type.toUpperCase()}
              </div>

              {node.type === 'room' && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-950/90 px-1.5 py-0.5 text-[10px] rounded text-emerald-400 font-semibold border border-emerald-500/30 shadow">
                  {node.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="text-[11px] text-slate-500 flex gap-4">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Corridor point</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Intersection corner</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Patient Room</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Currently Selected</span>
      </div>
    </div>
  );
}"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import {
  MapPin,
  Plus,
  Trash2,
  MousePointer,
  ArrowRight,
  Save,
  Zap,
  Loader2,
  Smartphone,
} from "lucide-react";

/* ---------- TYPES ---------- */
interface POI {
  id: number;
  nodeId: string;
  name: string;
  type: string;
  x: number;
  y: number;
  floorId: string;

  /* ✅ BEACON SUPPORT */
  beaconId?: string;
  beaconX?: number;
  beaconY?: number;
}

interface Route {
  id: number;
  from: string;
  to: string;
  distance: number;
  floorId: string;
}

interface MapData {
  id: string | number;
  name: string;
  url?: string;
}

/* ---------- GRAPH VALIDATOR ---------- */
function validateGraph(pois: POI[], routes: Route[]): string[] {
  const errors: string[] = [];
  const nodeIds = new Set<string>();

  for (const poi of pois) {
    if (nodeIds.has(poi.nodeId)) {
      errors.push(`Duplicate nodeId: ${poi.name}`);
    }

    nodeIds.add(poi.nodeId);
  }

  for (const route of routes) {
    const from = pois.find((p) => p.nodeId === route.from);
    const to = pois.find((p) => p.nodeId === route.to);

    if (!from || !to) {
      errors.push("Route has missing node");
      continue;
    }

    const isConnector =
      ["stairs", "lift"].includes(from.type) ||
      ["stairs", "lift"].includes(to.type);

    if (from.floorId !== to.floorId && !isConnector) {
      errors.push(
        `Illegal cross-floor route: ${from.name} → ${to.name}`
      );
    }
  }

  return errors;
}

export default function Editor() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean | null>(null);

  const [hospitalId, setHospitalId] = useState<string | null>(
    null
  );

  const [selectedMap, setSelectedMap] =
    useState<MapData | null>(null);

  const [pointsOfInterest, setPointsOfInterest] = useState<
    POI[]
  >([]);

  const [routes, setRoutes] = useState<Route[]>([]);

  const [activeTool, setActiveTool] =
    useState("pointer");

  const [selectedPOI, setSelectedPOI] =
    useState<POI | null>(null);

  const [routeStartPOI, setRouteStartPOI] =
    useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [isIdentifying, setIsIdentifying] =
    useState(false);

  const [activeFloor, setActiveFloor] =
    useState<number>(1);

  /* ✅ NEW */
  const [beaconMode, setBeaconMode] =
    useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const draggingPOIRef = useRef<POI | null>(null);

  const poiTypes = [
    { value: "entrance", label: "Entrance" },
    { value: "exit", label: "Exit" },
    { value: "medical", label: "Medical" },
    { value: "service", label: "Service" },
    { value: "emergency", label: "Emergency" },
    { value: "general", label: "General" },
    { value: "stairs", label: "Stairs" },
    { value: "lift", label: "Lift" },
  ];

  /* ---------- AUTH + LOAD ---------- */
  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/my`,
          {
            credentials: "include",
          }
        );

        if (!authRes.ok) {
          router.replace("/login?redirect=/editor");
          return;
        }

        const user = await authRes.json();

        setHospitalId(user.id);

        const params = new URLSearchParams(
          window.location.search
        );

        const mapId =
          params.get("mapId") || crypto.randomUUID();

        const mapUrl =
          localStorage.getItem("uploadedMapUrl") || "";

        setSelectedMap({
          id: mapId,
          name: "Hospital Floor Plan",
          url: mapUrl,
        });

        const floorRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/floor?hospitalId=${user.id}`,
          {
            credentials: "include",
          }
        );

        if (floorRes.ok) {
          const floors = await floorRes.json();

          const current = floors.find(
            (f: any) => f.id === mapId
          );

          if (current?.graphData) {
            setPointsOfInterest(
              current.graphData.pointsOfInterest || []
            );

            setRoutes(
              current.graphData.routes || []
            );
          }
        }

        setIsAuthenticated(true);
      } catch (err) {
        console.error("Initialization error:", err);
        setIsAuthenticated(false);
      }
    };

    init();
  }, [router]);

  /* ---------- SAVE ---------- */
  const handleSaveToDB = async () => {
    if (!hospitalId || !selectedMap) return;

    const errors = validateGraph(
      pointsOfInterest,
      routes
    );

    if (errors.length) {
      alert(
        "Fix these issues before saving:\n\n" +
          errors.join("\n")
      );

      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/floor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            hospitalId,
            mapId: selectedMap.id,
            name: selectedMap.name,
            floorLevel: activeFloor,

            /* ✅ SAVE BEACON DATA */
            graphData: {
              pointsOfInterest,
              routes,
            },
          }),
        }
      );

      const saved = await res.json();

      if (res.ok) {
        setSelectedMap((p) =>
          p ? { ...p, id: saved.id } : null
        );

        window.history.replaceState(
          null,
          "",
          `/editor?mapId=${saved.id}`
        );

        alert("Saved successfully.");
      }
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- AI ---------- */
  const triggerAutoIdentify = async () => {
    if (!selectedMap?.id) return;

    setIsIdentifying(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/poi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action: "IDENTIFY_AUTO",
            mapId: selectedMap.id,
            graphData: {
              nodes: pointsOfInterest,
            },
          }),
        }
      );

      const autoPois = await res.json();

      setPointsOfInterest((p) => [
        ...p,
        ...autoPois,
      ]);
    } finally {
      setIsIdentifying(false);
    }
  };

  /* ---------- POI CLICK ---------- */
  const handlePOIClick = (
    poi: POI,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    /* ✅ DELETE */
    if (activeTool === "delete") {
      setPointsOfInterest((p) =>
        p.filter((x) => x.id !== poi.id)
      );

      setRoutes((r) =>
        r.filter(
          (x) =>
            x.from !== poi.nodeId &&
            x.to !== poi.nodeId
        )
      );

      return;
    }

    /* ✅ ROUTE */
    if (activeTool === "route") {
      if (routeStartPOI === null) {
        setRouteStartPOI(poi.id);
      } else {
        const from = pointsOfInterest.find(
          (p) => p.id === routeStartPOI
        );

        if (!from) return;

        const isConnector =
          ["stairs", "lift"].includes(from.type) ||
          ["stairs", "lift"].includes(poi.type);

        if (
          from.floorId !== poi.floorId &&
          !isConnector
        ) {
          alert(
            "Cross-floor routes require stairs or lift"
          );

          setRouteStartPOI(null);

          return;
        }

        setRoutes((r) => [
          ...r,
          {
            id: Date.now(),
            from: from.nodeId,
            to: poi.nodeId,

            distance:
              from.floorId === poi.floorId
                ? Math.round(
                    Math.hypot(
                      poi.x - from.x,
                      poi.y - from.y
                    )
                  )
                : 1,

            floorId: from.floorId,
          },
        ]);

        setRouteStartPOI(null);
      }

      return;
    }

    setSelectedPOI(poi);
  };

  /* ---------- DRAG ---------- */
  const onMouseMove = (
    e: React.MouseEvent
  ) => {
    if (
      !draggingPOIRef.current ||
      !canvasRef.current
    )
      return;

    const rect =
      canvasRef.current.getBoundingClientRect();

    setPointsOfInterest((p) =>
      p.map((x) =>
        x.id === draggingPOIRef.current!.id
          ? {
              ...x,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            }
          : x
      )
    );
  };

  /* ---------- LOADING ---------- */
  if (isAuthenticated === null)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
          <p className="text-slate-500 font-medium">
            Loading Workspace...
          </p>
        </div>
      </div>
    );

  if (isAuthenticated === false)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-red-500">
          Authentication failed. Please log in again.
        </p>
      </div>
    );

  return (
    <Layout showSidebar={true}>
      <div className="flex flex-col h-screen bg-white">
        {/* HEADER */}
        <div className="h-16 border-b flex items-center justify-between px-8 bg-white z-30 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-extrabold text-gray-900 tracking-tight uppercase">
              Hospital Map Editor
            </h2>

            <span className="text-gray-300">|</span>

            <span className="text-sm text-gray-500 font-medium">
              {selectedMap?.name}
            </span>
          </div>

          <div className="flex gap-3 items-center">
            {/* FLOOR */}
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Floor
              </span>

              <input
                type="number"
                value={activeFloor}
                onChange={(e) =>
                  setActiveFloor(
                    Number(e.target.value)
                  )
                }
                className="w-16 px-2 py-1 text-sm font-bold border rounded-md text-center"
              />
            </div>

            {/* ✅ BEACON MODE */}
            <button
              onClick={() =>
                setBeaconMode(!beaconMode)
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                beaconMode
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              BEACON MODE
            </button>

            {/* AI */}
            <button
              onClick={triggerAutoIdentify}
              disabled={isIdentifying}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-sm font-bold hover:bg-amber-100 disabled:opacity-50 transition-all"
            >
              {isIdentifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}

              AI SCAN
            </button>

            {/* SAVE */}
            <button
              onClick={handleSaveToDB}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}

              SAVE CHANGES
            </button>

            {/* QR */}
            <button
              onClick={() =>
                router.push(
                  `/qr-generator?hospitalId=${hospitalId}&mapId=${selectedMap?.id}`
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all"
            >
              QR GEN
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* TOOLBAR */}
          <div className="w-20 border-r flex flex-col items-center gap-6 py-8 bg-gray-50 shrink-0">
            <Tool
              icon={<MousePointer size={22} />}
              label="Move"
              active={activeTool === "pointer"}
              onClick={() =>
                setActiveTool("pointer")
              }
            />

            <Tool
              icon={<Plus size={22} />}
              label="Add POI"
              active={activeTool === "poi"}
              onClick={() =>
                setActiveTool("poi")
              }
            />

            <Tool
              icon={<ArrowRight size={22} />}
              label="Add Route"
              active={activeTool === "route"}
              onClick={() => {
                setActiveTool("route");
                setRouteStartPOI(null);
              }}
            />

            <div className="w-10 h-px bg-gray-200 my-2" />

            <Tool
              icon={<Trash2 size={22} />}
              label="Delete"
              active={activeTool === "delete"}
              onClick={() =>
                setActiveTool("delete")
              }
            />
          </div>

          {/* CANVAS */}
          <div className="flex-1 p-8 bg-gray-100 overflow-auto flex justify-center items-start">
            <div
              ref={canvasRef}
              onClick={(e) => {
                if (activeTool === "poi") {
                  const rect =
                    canvasRef.current!.getBoundingClientRect();

                  setPointsOfInterest((prev) => [
                    ...prev,
                    {
                      id: Date.now(),
                      nodeId:
                        crypto.randomUUID(),

                      name: `Room ${
                        prev.length + 1
                      }`,

                      type: "general",

                      x:
                        e.clientX - rect.left,

                      y:
                        e.clientY - rect.top,

                      floorId: String(
                        activeFloor
                      ),

                      /* ✅ NEW */
                      beaconId: "",
                      beaconX:
                        e.clientX - rect.left,
                      beaconY:
                        e.clientY - rect.top,
                    },
                  ]);
                }
              }}
              onMouseMove={onMouseMove}
              onMouseUp={() => {
                draggingPOIRef.current = null;
              }}
              className="relative bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden"
              style={{
                width: "1200px",
                height: "800px",
                cursor:
                  activeTool === "poi"
                    ? "crosshair"
                    : "default",
              }}
            >
              {/* MAP */}
              {selectedMap?.url && (
                <img
                  src={selectedMap.url}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80 p-4"
                  alt="Floor plan"
                />
              )}

              {/* ROUTES */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {routes.map((route) => {
                  const from =
                    pointsOfInterest.find(
                      (p) =>
                        p.nodeId === route.from
                    );

                  const to =
                    pointsOfInterest.find(
                      (p) =>
                        p.nodeId === route.to
                    );

                  if (!from || !to) return null;

                  return (
                    <line
                      key={route.id}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeDasharray="8,5"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {/* POIS */}
              {pointsOfInterest
                .filter(
                  (p) =>
                    p.floorId ===
                    String(activeFloor)
                )
                .map((poi) => (
                  <div
                    key={poi.id}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all ${
                      selectedPOI?.id === poi.id
                        ? "scale-125"
                        : "hover:scale-110"
                    }`}
                    style={{
                      left: poi.x,
                      top: poi.y,
                    }}
                    onMouseDown={(e) => {
                      if (
                        activeTool === "pointer"
                      ) {
                        draggingPOIRef.current =
                          poi;

                        e.preventDefault();
                      }
                    }}
                    onClick={(e) =>
                      handlePOIClick(
                        poi,
                        e
                      )
                    }
                  >
                    {/* PIN */}
                    <div
                      className={`p-1.5 rounded-full border-2 ${
                        routeStartPOI ===
                        poi.id
                          ? "bg-green-500 border-white text-white animate-pulse"
                          : selectedPOI?.id ===
                            poi.id
                          ? "bg-indigo-600 border-white text-white shadow-lg"
                          : "bg-white border-gray-400 text-gray-600"
                      }`}
                    >
                      <MapPin
                        className="w-5 h-5"
                        fill="currentColor"
                        fillOpacity={0.2}
                      />
                    </div>

                    {/* NAME */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-0.5 bg-gray-900/80 text-white text-[9px] font-bold uppercase rounded whitespace-nowrap">
                      {poi.name}
                    </div>

                    {/* ✅ BEACON VISUAL */}
                    {beaconMode &&
                      poi.beaconId && (
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[8px] px-2 py-1 rounded bg-blue-600 text-white font-bold whitespace-nowrap">
                          {poi.beaconId}
                        </div>
                      )}
                  </div>
                ))}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-80 border-l p-6 bg-white space-y-6 overflow-y-auto shrink-0">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Active Elements
            </h3>

            <div className="space-y-3">
              {pointsOfInterest.map((poi) => (
                <div
                  key={poi.id}
                  onClick={() =>
                    setSelectedPOI(poi)
                  }
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedPOI?.id ===
                    poi.id
                      ? "bg-indigo-50 border-indigo-300"
                      : "bg-white border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {/* NAME */}
                  <div className="flex justify-between items-center mb-2">
                    <input
                      className="font-bold text-sm bg-transparent outline-none border-b border-transparent focus:border-indigo-400"
                      value={poi.name}
                      onChange={(e) =>
                        setPointsOfInterest(
                          (prev) =>
                            prev.map((p) =>
                              p.id === poi.id
                                ? {
                                    ...p,
                                    name:
                                      e.target
                                        .value,
                                  }
                                : p
                            )
                        )
                      }
                    />

                    <Trash2
                      size={14}
                      className="text-gray-300 hover:text-red-500"
                      onClick={() =>
                        setPointsOfInterest(
                          (prev) =>
                            prev.filter(
                              (p) =>
                                p.id !==
                                poi.id
                            )
                        )
                      }
                    />
                  </div>

                  {/* TYPE */}
                  <select
                    className="text-[10px] uppercase font-bold text-gray-400 bg-transparent outline-none w-full"
                    value={poi.type}
                    onChange={(e) =>
                      setPointsOfInterest(
                        (prev) =>
                          prev.map((p) =>
                            p.id === poi.id
                              ? {
                                  ...p,
                                  type:
                                    e.target
                                      .value,
                                }
                              : p
                          )
                      )
                    }
                  >
                    {poiTypes.map((t) => (
                      <option
                        key={t.value}
                        value={t.value}
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>

                  {/* ✅ BEACON */}
                  <div className="mt-4 border-t pt-3">
                    <div className="text-[9px] font-bold text-blue-500 uppercase mb-2">
                      Beacon Mapping
                    </div>

                    <input
                      type="text"
                      placeholder="Beacon MAC / UUID"
                      value={poi.beaconId || ""}
                      onChange={(e) =>
                        setPointsOfInterest(
                          (prev) =>
                            prev.map((p) =>
                              p.id === poi.id
                                ? {
                                    ...p,
                                    beaconId:
                                      e.target
                                        .value,
                                  }
                                : p
                            )
                        )
                      }
                      className="w-full border rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  {/* META */}
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-[9px] font-bold text-gray-400 uppercase">
                      Floor: {poi.floorId}
                    </div>

                    <div className="text-[7px] font-mono text-gray-300 truncate max-w-[100px]">
                      Node:{" "}
                      {poi.nodeId.split("-")[0]}
                      ...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Tool({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative p-4 rounded-2xl transition-all ${
        active
          ? "bg-indigo-600 text-white shadow-lg scale-110"
          : "text-gray-400 hover:bg-white hover:text-indigo-600"
      }`}
    >
      {icon}

      <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        {label}
      </span>
    </button>
  );
}
