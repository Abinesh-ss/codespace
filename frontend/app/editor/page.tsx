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
}
