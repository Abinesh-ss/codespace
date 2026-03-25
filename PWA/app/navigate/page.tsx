"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RotateCcw, X, Camera, Navigation, Volume2, VolumeX } from "lucide-react";

import QRAnchorScanner from "@/components/QRAnchorScanner";
import Compass from "@/components/Compass";
import FloorDetector from "@/components/FloorDetector";
import MapOverlay from "@/components/MapOverlay";
import NavigationSteps from "@/components/NavigationSteps";

export default function NavigatePage() {
  const [showScanner, setShowScanner] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  // State for Navigation and Mapping
  const [scannedNode, setScannedNode] = useState<{id: string, x: number, y: number} | null>(null);
  const [targetNode, setTargetNode] = useState<{id: string, x: number, y: number} | null>(null);
  const [pathCoords, setPathCoords] = useState<{x: number, y: number}[]>([]);
  const [floorId, setFloorId] = useState<string>("0");
  const [poiList, setPoiList] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState("Scan QR to Begin");
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  const speak = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Handle Device Orientation for the Map Arrow
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) setRotation(e.alpha);
    };
    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  // Fetch Active Hospital and POIs
  useEffect(() => {
    fetch("/api/hospital/active")
      .then((r) => r.json())
      .then((d) => {
        if (d?.id) {
          setHospitalId(d.id);
          return fetch(`/api/hospital/${d.id}/locations`);
        }
      })
      .then((r) => r?.json())
      .then((d) => {
        if (d?.locations) {
          const pois = d.locations.flatMap((loc: any) => 
            loc.pois.map((p: any) => ({ ...p, floorId: String(loc.floorId) }))
          );
          setPoiList(pois);
        }
      });
  }, []);

  const handleQRDetect = async (data: any) => {
    try {
      const raw = typeof data === "string" ? data : data?.data || data?.url;
      const qrId = raw.includes("/api/scan/") ? raw.split("/api/scan/")[1] : raw;
      
      const res = await fetch(`/api/scan/${qrId}`);
      const result = await res.json();

      if (res.ok) {
        // Capture specific coordinates for the map
        setScannedNode({ id: result.nodeId, x: result.x, y: result.y });
        setFloorId(String(result.floorId ?? "0"));
        setCurrentLocation(result.locationName);
        setShowScanner(false);
        speak(`Position updated. You are at ${result.locationName}`);
      }
    } catch (err) {
      console.error("Scan failed");
    }
  };

  return (
    <main className="fixed inset-0 h-screen w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <FloorDetector onFloor={(f) => setFloorId(f.toString())} />

      {/* HEADER */}
      <header className="h-16 shrink-0 px-6 flex justify-between items-center border-b border-white/10 bg-slate-900/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <Compass />
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/5 rounded-lg text-slate-400">
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-[10px] font-bold tracking-[0.4em] text-blue-400 uppercase">VAZHIKATTI</h1>
          <p className="text-[8px] text-slate-500 uppercase font-bold">{currentLocation}</p>
        </div>
        <button onClick={() => window.location.reload()} className="text-slate-400"><RotateCcw size={18} /></button>
      </header>

      {/* MAP AREA */}
      <div className="flex-1 relative w-full overflow-hidden z-10">
        <MapOverlay 
          poiList={poiList.filter(p => p.floorId === floorId)}
          userPos={scannedNode ? { x: scannedNode.x, y: scannedNode.y } : null}
          targetPos={targetNode ? { x: targetNode.x, y: targetNode.y } : undefined}
          path={pathCoords}
          rotation={rotation}
        />

        {scannedNode && !showScanner && (
          <button 
            onClick={() => setShowScanner(true)}
            className="absolute top-4 right-4 z-40 p-3 bg-blue-600 rounded-full shadow-lg border border-white/20 active:scale-90 transition-all"
          >
            <Camera size={20} className="text-white" />
          </button>
        )}

        {!scannedNode && !showScanner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-slate-950/80 backdrop-blur-sm z-20">
            <Navigation size={48} className="text-blue-500 animate-pulse" />
            <button 
              onClick={() => setShowScanner(true)}
              className="px-8 py-3 bg-blue-600 rounded-xl font-bold"
            >
              Scan QR to Start
            </button>
          </div>
        )}
      </div>

      {/* NAVIGATION FOOTER */}
      {scannedNode && (
        <footer className="shrink-0 p-6 bg-slate-900 border-t border-white/10 z-30 rounded-t-[2rem]">
          {!targetNode || isSearching ? (
            <div className="space-y-4">
              <div className="relative">
                <input 
                  autoFocus={isSearching}
                  placeholder="Where are you going?"
                  className="w-full p-4 bg-white/5 rounded-xl border border-white/10 text-white outline-none"
                  onFocus={() => setIsSearching(true)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
              </div>
              {isSearching && (
                <div className="max-h-40 overflow-y-auto space-y-2">
                   {poiList.filter(p => p.floorId === floorId).map((poi) => (
                      <button 
                        key={poi.id}
                        onClick={() => { 
                          setTargetNode({id: poi.nodeId, x: poi.x, y: poi.y}); 
                          setIsSearching(false); 
                        }} 
                        className="w-full p-3 text-left bg-white/10 rounded-lg text-sm"
                      >
                        {poi.name}
                      </button>
                   ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active Navigation</span>
                <button onClick={() => { setTargetNode(null); setPathCoords([]); }}><X size={16} className="text-slate-500" /></button>
              </div>
              <NavigationSteps 
                hospitalId={hospitalId || ""} 
                floorId={floorId}
                startNodeId={scannedNode.id}
                endNodeId={targetNode.id}
                onStepUpdate={(text) => speak(text)}
                onPathUpdate={(coords) => setPathCoords(coords)}
              />
            </div>
          )}
        </footer>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black">
          <QRAnchorScanner onDetect={handleQRDetect} />
          <button onClick={() => setShowScanner(false)} className="absolute top-10 right-6 p-3 bg-white/10 rounded-full"><X size={24} /></button>
        </div>
      )}
    </main>
  );
}
