"use client";

import React, { useState, useRef, useEffect } from "react";

interface NodePOI {
  nodeId: string;
  name: string;
  type: string;
  x: number;
  y: number;
}

interface Edge {
  fromNodeId: string;
  toNodeId: string;
  distance: number;
}

interface GraphData {
  pointsOfInterest: NodePOI[];
  edges: Edge[];
}

export default function MapEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Editor configuration states
  const [hospitalId, setHospitalId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("new-uuid-placeholder");
  const [floorName, setFloorName] = useState<string>("Floor 1");
  const [floorLevel, setFloorLevel] = useState<number>(1);
  const [bgImageUrl, setBgImageUrl] = useState<string>("");

  // Graph state
  const [pois, setPois] = useState<NodePOI[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // UI state
  const [mode, setMode] = useState<"addNode" | "addEdge" | "delete">("addNode");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeNameInput, setNodeNameInput] = useState<string>("");
  const [nodeTypeInput, setNodeTypeInput] = useState<string>("general");
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Background image element reference
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  // Load background image when URL changes
  useEffect(() => {
    if (!bgImageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = bgImageUrl;
    img.onload = () => setBgImage(img);
  }, [bgImageUrl]);

  // Canvas Rerender Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render background map
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render Edges
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    edges.forEach((edge) => {
      const from = pois.find((p) => p.nodeId === edge.fromNodeId);
      const to = pois.find((p) => p.nodeId === edge.toNodeId);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    });

    // Render Nodes/POIs
    pois.forEach((poi) => {
      const isSelected = poi.nodeId === selectedNodeId;
      ctx.beginPath();
      ctx.arc(poi.x, poi.y, isSelected ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? "#ef4444" : "#10b981";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Render Label
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#1f2937";
      ctx.fillText(poi.name || poi.nodeId.substring(0, 4), poi.x + 12, poi.y + 4);
    });
  }, [pois, edges, bgImage, selectedNodeId]);

  // Canvas Click Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // Check if click hit an existing node
    const clickedNode = pois.find(
      (p) => Math.hypot(p.x - x, p.y - y) <= 12
    );

    if (mode === "addNode") {
      if (!clickedNode) {
        const newNode: NodePOI = {
          nodeId: crypto.randomUUID(),
          name: nodeNameInput || `Node ${pois.length + 1}`,
          type: nodeTypeInput,
          x,
          y,
        };
        setPois((prev) => [...prev, newNode]);
      } else {
        setSelectedNodeId(clickedNode.nodeId);
      }
    } else if (mode === "addEdge") {
      if (clickedNode) {
        if (!selectedNodeId) {
          setSelectedNodeId(clickedNode.nodeId);
        } else if (selectedNodeId !== clickedNode.nodeId) {
          const fromNode = pois.find((p) => p.nodeId === selectedNodeId);
          if (fromNode) {
            const dist = Math.round(Math.hypot(fromNode.x - clickedNode.x, fromNode.y - clickedNode.y));
            const newEdge: Edge = {
              fromNodeId: selectedNodeId,
              toNodeId: clickedNode.nodeId,
              distance: dist,
            };
            setEdges((prev) => [...prev, newEdge]);
          }
          setSelectedNodeId(null);
        }
      }
    } else if (mode === "delete") {
      if (clickedNode) {
        setPois((prev) => prev.filter((p) => p.nodeId !== clickedNode.nodeId));
        setEdges((prev) =>
          prev.filter(
            (e) =>
              e.fromNodeId !== clickedNode.nodeId &&
              e.toNodeId !== clickedNode.nodeId
          )
        );
        if (selectedNodeId === clickedNode.nodeId) setSelectedNodeId(null);
      }
    }
  };

  // Save Graph Data to Backend API
  const handleSaveFloor = async () => {
    if (!hospitalId) {
      setMessage("Please enter a valid Hospital ID.");
      return;
    }

    setSaving(true);
    setMessage("");

    const graphData: GraphData = {
      pointsOfInterest: pois,
      edges,
    };

    try {
      const res = await fetch("/api/hospital/floor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId,
          mapId: floorId,
          name: floorName,
          level: floorLevel,
          graphData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Floor map and node topology saved successfully!");
        if (data.id) setFloorId(data.id);
      } else {
        setMessage(`Save failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setMessage(`Server error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Hospital Map & Node Editor</h1>
        <button
          onClick={handleSaveFloor}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Floor & Graph"}
        </button>
      </div>

      {message && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-sm">
          {message}
        </div>
      )}

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 border rounded-lg shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Hospital ID</label>
          <input
            type="text"
            className="w-full border px-3 py-1.5 rounded text-sm"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            placeholder="Hospital UUID"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Floor Name</label>
          <input
            type="text"
            className="w-full border px-3 py-1.5 rounded text-sm"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Floor Level</label>
          <input
            type="number"
            className="w-full border px-3 py-1.5 rounded text-sm"
            value={floorLevel}
            onChange={(e) => setFloorLevel(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Background Image URL</label>
          <input
            type="text"
            className="w-full border px-3 py-1.5 rounded text-sm"
            value={bgImageUrl}
            onChange={(e) => setBgImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Editor Canvas & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 border rounded-lg overflow-hidden bg-white shadow-sm flex justify-center items-center p-2">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            className="border cursor-crosshair rounded"
          />
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 border rounded-lg shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Editor Mode</h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setMode("addNode"); setSelectedNodeId(null); }}
              className={`px-3 py-2 text-left rounded-md text-sm font-medium border ${mode === "addNode" ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-gray-50 text-gray-700"}`}
            >
              📍 Add Node / POI
            </button>
            <button
              onClick={() => { setMode("addEdge"); setSelectedNodeId(null); }}
              className={`px-3 py-2 text-left rounded-md text-sm font-medium border ${mode === "addEdge" ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-gray-50 text-gray-700"}`}
            >
              🔗 Draw Path Edge
            </button>
            <button
              onClick={() => { setMode("delete"); setSelectedNodeId(null); }}
              className={`px-3 py-2 text-left rounded-md text-sm font-medium border ${mode === "delete" ? "bg-red-50 border-red-500 text-red-700" : "bg-gray-50 text-gray-700"}`}
            >
              🗑️ Delete Element
            </button>
          </div>

          <hr className="my-2" />

          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Next Node Defaults</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Node Name</label>
            <input
              type="text"
              className="w-full border px-3 py-1.5 rounded text-sm"
              value={nodeNameInput}
              onChange={(e) => setNodeNameInput(e.target.value)}
              placeholder="e.g. ICU, Entrance"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Node Type</label>
            <select
              className="w-full border px-3 py-1.5 rounded text-sm"
              value={nodeTypeInput}
              onChange={(e) => setNodeTypeInput(e.target.value)}
            >
              <option value="general">General</option>
              <option value="room">Room / POI</option>
              <option value="elevator">Elevator</option>
              <option value="stairs">Stairs</option>
              <option value="entrance">Entrance</option>
            </select>
          </div>

          <hr className="my-2" />

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Total Nodes:</strong> {pois.length}</p>
            <p><strong>Total Edges:</strong> {edges.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
