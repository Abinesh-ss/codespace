"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  RotateCcw,
  X,
  Camera,
  Volume2,
  VolumeX,
  MapPin,
  ArrowRight,
  Navigation,
  Activity,
  Zap
} from "lucide-react";

import QRAnchorScanner from "@/components/QRAnchorScanner";
import NavigationSteps from "@/components/NavigationSteps";
import Compass from "@/components/Compass";
import FloorDetector from "@/components/FloorDetector";
import MapOverlay from "@/components/MapOverlay";

interface POI {
  id: string;
  name: string;
  qrId: string;
  nodeId: string;
  floorId: string;
  x: number;
  y: number;
}

export default function NavigatePage() {
  // --- UI & SYSTEM STATES ---
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lang, setLang] = useState<"en" | "ta">("ta");
  const [error, setError] = useState<string | null>(null);

  // --- DATA STATES ---
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [poiList, setPoiList] = useState<POI[]>([]);
  const [floorMap, setFloorMap] = useState<Record<number, string>>({}); 
  
  // --- NAVIGATION & TRACKING STATES ---
  const [floorId, setFloorId] = useState<string | null>(null);
  const [scannedNode, setScannedNode] = useState<{ id: string; x: number; y: number } | null>(null);
  const [targetNode, setTargetNode] = useState<{ id: string; x: number; y: number; name?: string } | null>(null);
  const [pathCoords, setPathCoords] = useState<{ x: number; y: number }[]>([]);
  const [currentLocation, setCurrentLocation] = useState("Scan QR to Begin");

  // --- LIVE DEAD RECKONING STATES ---
  const [livePos, setLivePos] = useState<{ x: number, y: number } | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const lastAccel = useRef(0);
  const strideLength = 0.75; // Meters per step
  const pixelsPerMeter = 18;  // Adjust this based on your map scale
  const stepThreshold = 13.5; // Sensitivity for step detection

  // --- ANALYTICS ---
  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);

  // 1. VOICE ENGINE
  const speak = useCallback((en: string, ta: string) => {
    if (isMuted || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lang === "en" ? en : ta);
    utterance.lang = lang === "en" ? "en-US" : "ta-IN";
    window.speechSynthesis.speak(utterance);
  }, [isMuted, lang]);

  // 2. GYROSCOPE & COMPASS SENSOR
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) setRotation(e.alpha);
    };
    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  // 3. PEDESTRIAN DEAD RECKONING (LIVE TRACKING)
  useEffect(() => {
    const handleMotion = (e: DeviceMotionEvent) => {
      if (!livePos || !e.accelerationIncludingGravity) return;

      const { x, y, z } = e.accelerationIncludingGravity;
      const acceleration = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2);
      const delta = Math.abs(acceleration - lastAccel.current);
      lastAccel.current = acceleration;

      // Detect Step Impact
      if (delta > stepThreshold) {
        setStepCount(prev => prev + 1);
        
        setLivePos(current => {
          if (!current) return null;
          // Trigonometry: Move X and Y based on Compass Rotation
          const rad = (rotation * Math.PI) / 180;
          return {
            x: current.x + (Math.sin(rad) * strideLength * pixelsPerMeter),
            y: current.y - (Math.cos(rad) * strideLength * pixelsPerMeter)
          };
        });
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [livePos, rotation]);

  // 4. INITIAL DATA FETCH
  useEffect(() => {
    async function initData() {
      try {
        const hospRes = await fetch("/api/hospital/active");
        const hospData = await hospRes.json();
        
        if (hospData?.id) {
          setHospitalId(hospData.id);
          const locRes = await fetch(`/api/hospital/${hospData.id}/locations`);
          const locData = await locRes.json();

          if (locData?.locations) {
            const mapping: Record<number, string> = {};
            const allPois: POI[] = [];

            locData.locations.forEach((loc: any) => {
              const sourcePois = loc.pois || []; 
              sourcePois.forEach((p: any) => {
                const pFloorId = p.floor?.id || loc.mapId;
                const pLevel = p.floor?.level;
                if (pLevel !== undefined) mapping[Number(pLevel)] = String(pFloorId);

                allPois.push({
                  id: p.id,
                  name: p.name,
                  qrId: p.qrId,
                  nodeId: p.nodeId,
                  floorId: String(pFloorId), 
                  x: Number(p.x) || 0,
                  y: Number(p.y) || 0
                });
              });
            });

            setFloorMap(mapping);
            setPoiList(allPois);
            if (allPois.length > 0 && !floorId) setFloorId(allPois[0].floorId);
          }
        }
      } catch (err) {
        console.error("POI Load Error:", err);
      }
    }
    initData();
  }, []);

  // 5. FILTER LOGIC
  const filteredPOIs = useMemo(() => {
    if (!floorId) return [];
    return poiList.filter(p => 
      String(p.floorId) === String(floorId) && 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [poiList, floorId, searchQuery]);

  // 6. DISTANCE CALCULATION
  useEffect(() => {
    if (!pathCoords.length) return;
    let total = 0;
    for (let i = 1; i < pathCoords.length; i++) {
      total += Math.hypot(pathCoords[i].x - pathCoords[i-1].x, pathCoords[i].y - pathCoords[i-1].y);
    }
    setDistance(Math.round(total * 0.05));
    setEta(Math.ceil((total * 0.05) / 1.4 / 60) || 1);
  }, [pathCoords]);

  const handleQRDetect = async (data: any) => {
    try {
      const raw = typeof data === "string" ? data : data?.data || data?.url;
      const qrId = raw.includes("/api/scan/") ? raw.split("/api/scan/")[1] : raw;
      
      const res = await fetch(`/api/scan/${qrId}`);
      const result = await res.json();
      
      if (res.ok) {
        const node = { id: result.nodeId, x: Number(result.x), y: Number(result.y) };
        setScannedNode(node);
        setLivePos({ x: node.x, y: node.y }); // Reset Dead Reckoning to QR Location
        setFloorId(String(result.floorId)); 
        setCurrentLocation(result.locationName);
        setShowScanner(false);
        speak("Location synchronized", "உங்கள் இடம் புதுப்பிக்கப்பட்டது");
      }
    } catch (err) {
      setError("QR Scan Failed");
    }
  };

  return (
    <main className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden font-sans select-none">
      <FloorDetector onFloor={(level) => {
        if (floorMap[level]) setFloorId(floorMap[level]);
      }} />

      {/* DEAD RECKONING HUD */}
      <div className="absolute top-20 left-4 z-[100] space-y-2">
        <div className="bg-black/80 p-2 rounded border border-emerald-500/30 text-[9px] font-mono text-emerald-400">
          <div className="flex items-center gap-2"><Activity size={10}/> SYSTEM ACTIVE</div>
          Visible: {filteredPOIs.length} | Steps: {stepCount}
        </div>
        {livePos && (
          <div className="bg-blue-600/20 p-2 rounded border border-blue-500/30 text-[9px] font-mono text-blue-400 flex items-center gap-2">
            <Zap size={10} className="animate-pulse" /> LIVE TRACKING ENABLED
          </div>
        )}
      </div>

      <header className="h-16 shrink-0 flex justify-between items-center px-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl z-50">
        <Compass />
        <div className="text-center">
          <h1 className="text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase">Vazhikatti</h1>
          <p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px] uppercase">{currentLocation}</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setLang(lang === "en" ? "ta" : "en")} className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
             {lang === "en" ? "EN" : "தமிழ்"}
           </button>
           <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400">
             {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
           </button>
        </div>
      </header>

      <div className="flex-1 relative z-0">
        <MapOverlay
          poiList={filteredPOIs}
          userPos={livePos ? { ...livePos, id: "live" } : scannedNode}
          targetPos={targetNode || undefined}
          path={pathCoords}
          rotation={rotation}
        />

        {!scannedNode && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-10 text-center">
            <div className="p-6 bg-blue-600/20 rounded-[2rem] border border-blue-500/30 mb-6">
              <Camera size={40} className="text-blue-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black mb-2">Hospital Navigator</h2>
            <p className="text-slate-400 text-sm mb-10">Scan a QR code to enable Live Tracking.</p>
            <button onClick={() => setShowScanner(true)} className="w-full py-5 bg-blue-600 rounded-3xl font-black text-lg shadow-xl shadow-blue-900/40 active:scale-95 transition-all">
              START SCANNING
            </button>
          </div>
        )}

        {scannedNode && (
          <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-40">
            {targetNode && (
              <button onClick={() => {setTargetNode(null); setPathCoords([]);}} className="p-4 bg-slate-800 rounded-2xl border border-white/10 text-white shadow-2xl">
                <RotateCcw size={24} />
              </button>
            )}
            <button onClick={() => setShowScanner(true)} className="p-5 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/40 text-white active:scale-90 transition-all">
              <Camera size={28} />
            </button>
          </div>
        )}
      </div>

      {scannedNode && (
        <footer className="shrink-0 p-6 bg-slate-900 border-t border-white/10 z-50 rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.5)]">
          {targetNode ? (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Navigation Active</span>
                  <p className="text-xl font-bold truncate max-w-[200px]">{targetNode.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-black text-emerald-400 leading-none">{distance}m</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{eta} min walk</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-3xl p-2 border border-white/5">
                <NavigationSteps
                  startNodeId={scannedNode.id}
                  endNodeId={targetNode.id}
                  floorId={floorId!}
                  hospitalId={hospitalId!}
                  lang={lang}
                  onStepUpdate={speak}
                  onPathUpdate={setPathCoords}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Where to?"
                  className="w-full py-4 pl-14 pr-6 bg-black/40 rounded-2xl border border-white/5 outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredPOIs.length > 0 ? filteredPOIs.map((poi) => (
                  <button
                    key={poi.id}
                    onClick={() => setTargetNode({ id: poi.nodeId, x: poi.x, y: poi.y, name: poi.name })}
                    className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 active:bg-blue-600 transition-all group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2 bg-slate-800 rounded-xl group-active:bg-blue-400/20">
                        <MapPin size={20} className="text-blue-500 group-active:text-white" />
                      </div>
                      <span className="font-bold text-slate-200 group-active:text-white">{poi.name}</span>
                    </div>
                    <ArrowRight size={18} className="text-slate-700 group-active:text-white" />
                  </button>
                )) : (
                  <div className="py-10 text-center text-slate-600 text-sm italic">No departments found on this floor.</div>
                )}
              </div>
            </div>
          )}
        </footer>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <div className="p-6 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/10">
            <h2 className="font-black text-sm uppercase tracking-widest">Identify Location</h2>
            <button onClick={() => setShowScanner(false)} className="p-3 bg-white/10 rounded-full"><X size={24} /></button>
          </div>
          <div className="flex-1 relative">
            <QRAnchorScanner onDetect={handleQRDetect} />
          </div>
        </div>
      )}
    </main>
  );
}
