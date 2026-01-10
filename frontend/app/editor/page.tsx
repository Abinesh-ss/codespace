"use client";

import { useEffect, useState, useRef } from "react";
import Layout from "@/components/Layout";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  MousePointer, 
  ArrowRight, 
  Save, 
  Zap, 
  Loader2 
} from "lucide-react";

/* ---------- TYPES ---------- */
interface POI {
  id: number;
  dbId?: string; 
  name: string;
  type: string;
  x: number;
  y: number;
}

interface Route {
  id: number;
  from: number;
  to: number;
  distance: number;
}

interface MapData {
  id: string | number;
  name: string;
  url?: string;
}

export default function Editor() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<POI[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeTool, setActiveTool] = useState("pointer");
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [routeStartPOI, setRouteStartPOI] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const draggingPOIRef = useRef<POI | null>(null);

  const poiTypes = [
    { value: "entrance", label: "Entrance" },
    { value: "exit", label: "Exit" },
    { value: "medical", label: "Medical" },
    { value: "service", label: "Service" },
    { value: "emergency", label: "Emergency" },
    { value: "general", label: "General" },
  ];

  /* ---------- AUTH + FETCH EXISTING DATA ---------- */
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/my`, { 
          credentials: "include" 
        });

        if (!res.ok) { window.location.href = "/login"; return; }

        const userData = await res.json();
        setHospitalId(userData.id);

        const urlParams = new URLSearchParams(window.location.search);
        let mapId = urlParams.get("mapId");
        const mapUrl = localStorage.getItem("uploadedMapUrl");

        // 1. Load basic map info from LocalStorage/URL
        setSelectedMap({
          id: mapId || "new-uuid-placeholder",
          name: "Hospital Floor Plan",
          url: mapUrl || "",
        });

        // 2. FETCH EXISTING GRAPH DATA FROM DB (If mapId is real)
        if (mapId && mapId !== "new-uuid-placeholder") {
          const floorRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/floor?hospitalId=${userData.id}`, {
            credentials: "include"
          });
          const floors = await floorRes.json();
          const currentFloor = floors.find((f: any) => f.id === mapId);
          
          if (currentFloor && currentFloor.graphData) {
            setPointsOfInterest(currentFloor.graphData.pointsOfInterest || []);
            setRoutes(currentFloor.graphData.routes || []);
            // Update URL in case it's different in DB
            if (currentFloor.imageUrl) {
              setSelectedMap(prev => prev ? { ...prev, url: currentFloor.imageUrl } : null);
            }
          }
        }

        setIsAuthenticated(true);
      } catch (err) {
        console.error("Initialization error:", err);
        window.location.href = "/login";
      }
    };

    checkAuthAndLoad();
  }, []);

  /* ---------- PERSISTENCE LOGIC ---------- */
  const handleSaveToDB = async () => {
    if (!hospitalId || !selectedMap) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/floor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          hospitalId,
          mapId: selectedMap.id, // Current ID (placeholder or real)
          name: selectedMap.name,
          graphData: { pointsOfInterest, routes }
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      const savedFloor = await res.json();
      
      // ✅ SYNC NEW ID: Update state and URL so next save is an UPDATE, not a CREATE
      if (savedFloor.id) {
        setSelectedMap(prev => prev ? { ...prev, id: savedFloor.id } : null);
        window.history.replaceState(null, "", `/editor?mapId=${savedFloor.id}`);
      }
      
      alert("Floor plan saved successfully!");
      
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error saving data. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const triggerAutoIdentify = async () => {
    if (!selectedMap?.id) return;
    setIsIdentifying(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/poi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "IDENTIFY_AUTO",
          mapId: selectedMap.id,
          graphData: { nodes: pointsOfInterest }
        })
      });
      
      const autoPois = await res.json();
      // Ensure we don't duplicate existing IDs if AI returns them
      setPointsOfInterest(prev => [...prev, ...autoPois]);
    } catch (err) {
      console.error("AI Identification failed:", err);
    } finally {
      setIsIdentifying(false);
    }
  };

  /* ---------- EDITOR ACTIONS ---------- */
  const handlePOIClick = (poi: POI, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === "delete") {
      setPointsOfInterest(prev => prev.filter(p => p.id !== poi.id));
      setRoutes(prev => prev.filter(r => r.from !== poi.id && r.to !== poi.id));
      return;
    }
    if (activeTool === "route") {
      if (routeStartPOI === null) {
        setRouteStartPOI(poi.id);
      } else if (routeStartPOI !== poi.id) {
        const from = pointsOfInterest.find(p => p.id === routeStartPOI);
        if (!from) return;
        setRoutes(prev => [
          ...prev,
          {
            id: Date.now(),
            from: from.id,
            to: poi.id,
            distance: Math.round(Math.hypot(poi.x - from.x, poi.y - from.y)),
          },
        ]);
        setRouteStartPOI(null);
      }
      return;
    }
    setSelectedPOI(poi);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingPOIRef.current || !canvasRef.current || activeTool !== "pointer") return;
    const rect = canvasRef.current.getBoundingClientRect();
    setPointsOfInterest(prev =>
      prev.map(p =>
        p.id === draggingPOIRef.current!.id
          ? { ...p, x: e.clientX - rect.left, y: e.clientY - rect.top }
          : p
      )
    );
  };

  if (isAuthenticated === null) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <Layout showSidebar>
      <div className="flex flex-col h-screen bg-white">
        {/* HEADER */}
        <div className="h-16 border-b flex items-center justify-between px-8 bg-white z-30 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-extrabold text-gray-900 tracking-tight">HOSPITAL MAP EDITOR</h2>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500 font-medium">{selectedMap?.name}</span>
          </div>
          
          <div className="flex gap-3">
            <button onClick={triggerAutoIdentify} disabled={isIdentifying} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-sm font-bold hover:bg-amber-100 disabled:opacity-50 transition-all">
              {isIdentifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              AI SCAN
            </button>
            <button onClick={handleSaveToDB} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md disabled:opacity-50 transition-all">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              SAVE CHANGES
            </button>
            <button 
              onClick={() => window.location.href = `/qr-generator?hospitalId=${hospitalId}&mapId=${selectedMap?.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all"
            >
              QR GEN →
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* TOOLBAR */}
          <div className="w-20 border-r flex flex-col items-center gap-6 py-8 bg-gray-50 shrink-0">
            <Tool icon={<MousePointer size={22} />} label="Move" active={activeTool === "pointer"} onClick={() => setActiveTool("pointer")} />
            <Tool icon={<Plus size={22} />} label="Add POI" active={activeTool === "poi"} onClick={() => setActiveTool("poi")} />
            <Tool icon={<ArrowRight size={22} />} label="Add Route" active={activeTool === "route"} onClick={() => { setActiveTool("route"); setRouteStartPOI(null); }} />
            <div className="w-10 h-px bg-gray-200 my-2" />
            <Tool icon={<Trash2 size={22} />} label="Delete" active={activeTool === "delete"} onClick={() => setActiveTool("delete")} />
          </div>

          {/* EDITOR CANVAS */}
          <div className="flex-1 p-8 bg-gray-100 overflow-auto flex justify-center items-start">
            <div
              ref={canvasRef}
              onClick={(e) => {
                if (activeTool === "poi") {
                  const rect = canvasRef.current!.getBoundingClientRect();
                  setPointsOfInterest(prev => [...prev, { 
                    id: Date.now(), 
                    name: `Room ${prev.length + 1}`, 
                    type: "general", 
                    x: e.clientX - rect.left, 
                    y: e.clientY - rect.top 
                  }]);
                }
              }}
              onMouseMove={onMouseMove}
              onMouseUp={() => { draggingPOIRef.current = null; }}
              className="relative bg-white shadow-2xl rounded-xl border border-gray-200"
              style={{ width: '1200px', height: '800px', cursor: activeTool === "poi" ? "crosshair" : "default" }}
            >
              {selectedMap?.url && (
                <img 
                  src={selectedMap.url} 
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80 p-4" 
                  alt="Floor plan"
                />
              )}

              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {routes.map(route => {
                  const from = pointsOfInterest.find(p => p.id === route.from);
                  const to = pointsOfInterest.find(p => p.id === route.to);
                  if (!from || !to) return null;
                  return (
                    <line key={route.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#6366f1" strokeWidth="3" strokeDasharray="8,5" strokeLinecap="round" />
                  );
                })}
              </svg>

              {pointsOfInterest.map(poi => (
                <div
                  key={poi.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all ${
                    selectedPOI?.id === poi.id ? "scale-125" : "hover:scale-110"
                  }`}
                  style={{ left: poi.x, top: poi.y }}
                  onMouseDown={(e) => { if(activeTool === "pointer") { draggingPOIRef.current = poi; e.preventDefault(); } }}
                  onClick={(e) => handlePOIClick(poi, e)}
                >
                  <div className={`p-1.5 rounded-full border-2 ${
                    routeStartPOI === poi.id ? "bg-green-500 border-white text-white animate-pulse" :
                    selectedPOI?.id === poi.id ? "bg-indigo-600 border-white text-white shadow-lg" : 
                    "bg-white border-gray-400 text-gray-600"
                  }`}>
                    <MapPin className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-0.5 bg-gray-900/80 text-white text-[9px] font-bold uppercase rounded whitespace-nowrap">
                    {poi.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR PROPERTIES */}
          <div className="w-80 border-l p-6 bg-white space-y-6 overflow-y-auto shrink-0">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Elements</h3>
            <div className="space-y-3">
              {pointsOfInterest.map(poi => (
                <div key={poi.id} onClick={() => setSelectedPOI(poi)} className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedPOI?.id === poi.id ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-100 hover:border-gray-200"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <input className="font-bold text-sm bg-transparent outline-none border-b border-transparent focus:border-indigo-400" value={poi.name} onChange={(e) => setPointsOfInterest(prev => prev.map(p => p.id === poi.id ? {...p, name: e.target.value} : p))} />
                    <Trash2 size={14} className="text-gray-300 hover:text-red-500" onClick={() => setPointsOfInterest(prev => prev.filter(p => p.id !== poi.id))} />
                  </div>
                  <select className="text-[10px] uppercase font-bold text-gray-400 bg-transparent outline-none w-full" value={poi.type} onChange={(e) => setPointsOfInterest(prev => prev.map(p => p.id === poi.id ? {...p, type: e.target.value} : p))}>
                    {poiTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Tool({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; }) {
  return (
    <button onClick={onClick} className={`group relative p-4 rounded-2xl transition-all ${
      active ? "bg-indigo-600 text-white shadow-lg scale-110" : "text-gray-400 hover:bg-white hover:text-indigo-600"
    }`}>
      {icon}
      <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        {label}
      </span>
    </button>
  );
}
