"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, RotateCcw, X, Camera, Navigation, Volume2, VolumeX, Languages } from "lucide-react";

import QRAnchorScanner from "@/components/QRAnchorScanner";
import Compass from "@/components/Compass";
import FloorDetector from "@/components/FloorDetector";
import MapOverlay from "@/components/MapOverlay";
import NavigationSteps from "@/components/NavigationSteps";

// ✅ Explicit API Base URL mapping targeting your port 3000 database server
const BACKEND_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// Complete English to Tamil Translation Dictionary Map
const translations: { [key: string]: string } = {
  "Scan QR to Begin": "தொடங்க QR குறியீட்டை ஸ்கேன் செய்யவும்",
  "Scan QR to Start": "தொடங்க ஸ்கேன் செய்யவும்",
  "Search Departments...": "பிரிவுகளைத் தேடுங்கள்...",
  "Active Navigation": "செயலில் உள்ள வழிசெலுத்தல்",
  "No points loaded. Try re-scanning.": "தரவு கிடைக்கவில்லை. மீண்டும் ஸ்கேன் செய்யவும்.",
  "No destinations match your search.": "தேடலுக்குரிய இடங்கள் எதுவும் இல்லை."
};

export default function NavigatePage() {
  // UI & Interaction States
  const [showScanner, setShowScanner] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Managed search matching state
  const [isMuted, setIsMuted] = useState(false);
  const [lang, setLang] = useState<"en" | "ta">("en"); // Dynamic language context state
  const [rotation, setRotation] = useState(0);
  const [isFloorOverridden, setIsFloorOverridden] = useState(false);
  
  // Navigation & Mapping States
  const [scannedNode, setScannedNode] = useState<{id: string, x: number, y: number} | null>(null);
  const [targetNode, setTargetNode] = useState<{id: string, x: number, y: number} | null>(null);
  const [pathCoords, setPathCoords] = useState<{x: number, y: number}[]>([]);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [poiList, setPoiList] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState("Scan QR to Begin");
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);

  // Translation Helper Function
  const t = useCallback((text: string) => {
    if (lang === "en") return text;
    if (translations[text]) return translations[text];
    
    // Check for dynamic vocal strings matching current tracking scenarios
    if (text.startsWith("Position updated. You are at ")) {
      const loc = text.replace("Position updated. You are at ", "");
      return `இருப்பிடம் புதுப்பிக்கப்பட்டது. நீங்கள் இப்போது ${loc}-ல் உள்ளீர்கள்.`;
    }
    if (text.startsWith("Routing path to ")) {
      const dest = text.replace("Routing path to ", "");
      return `${dest}-விற்கான வழித்தடம் கணக்கிடப்படுகிறது.`;
    }
    return text;
  }, [lang]);

  // Voice Synthesis Setup
  const speak = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const translatedText = t(text);
    const utterance = new SpeechSynthesisUtterance(translatedText);
    
    if (lang === "ta") {
      utterance.lang = "ta-IN"; 
      utterance.rate = 0.9;
    } else {
      utterance.lang = "en-US";
      utterance.rate = 1.0;
    }
    window.speechSynthesis.speak(utterance);
  }, [isMuted, lang, t]);

  // Caching handlers to preserve functional component rendering sanity
  const handlePathUpdate = useCallback((coords: { x: number; y: number }[]) => {
    setPathCoords(coords);
  }, []);

  const handleStepUpdate = useCallback((text: string) => {
    speak(text);
  }, [speak]);

  // Real-time computed filter matching algorithm for search queries
  const filteredPoiList = useMemo(() => {
    if (!searchQuery.trim()) return poiList;
    return poiList.filter((poi) =>
      poi.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, poiList]);

  // Device Orientation for Map Rotation
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) setRotation(e.alpha);
    };
    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  // Fetch Hospital Context on Mount (Patched to intercept Database Port 3000)
  useEffect(() => {
    fetch(`${BACKEND_API_BASE}/api/hospital/active`)
      .then(async (r) => {
        const contentType = r.headers.get("content-type");
        if (!r.ok || !contentType || !contentType.includes("application/json")) {
          throw new Error("Port 3000 interface did not answer with legitimate JSON parameters.");
        }
        return r.json();
      })
      .then((d) => {
        if (d?.id) setHospitalId(d.id);
      })
      .catch(err => {
        console.error("Initial context fetch failed, ensuring default fallback active:", err);
      });
  }, []);

  /**
   * Robust QR Detection Handler
   * Handles raw UUIDs or full URLs (http://localhost:3000/api/scan/ID)
   */
const handleQRDetect = async (data: any) => {
  try {
    console.log("📦 Full QR Payload:", data);

    // SAFELY extract QR text
    let raw = "";

    if (typeof data === "string") {
      raw = data;
    } else if (data?.data) {
      raw = data.data;
    } else if (data?.text) {
      raw = data.text;
    } else if (data?.rawValue) {
      raw = data.rawValue;
    } else if (Array.isArray(data) && data[0]?.rawValue) {
      raw = data[0].rawValue;
    }

    if (!raw) {
      throw new Error("QR scanner returned empty data");
    }

    console.log("✅ QR Raw Data:", raw);

    // Extract UUID from URL if necessary
    let qrId = raw;

    if (raw.includes("/api/scan/")) {
      const parts = raw.split("/api/scan/");
      qrId = parts[parts.length - 1];
    }

    qrId = qrId.split(/[?#]/)[0].replace(/\/$/, "");

    console.log("✅ Parsed QR ID:", qrId);

    // API Request
    const res = await fetch(
      `${BACKEND_API_BASE}/api/scan/${qrId}`,
      {
        method: "GET",
        mode: "cors",
      }
    );

    if (!res.ok) {
      throw new Error(`Scan API failed: ${res.status}`);
    }

    const result = await res.json();

    console.log("✅ Scan API Response:", result);

    // Validate response
    if (!result?.nodeId) {
      throw new Error("Missing nodeId in API response");
    }

    if (result.hospitalId) {
  setHospitalId(String(result.hospitalId));
}

    // Update app state
    setScannedNode({
      id: result.nodeId,
      x: Number(result.x) || 0,
      y: Number(result.y) || 0,
    });

    setFloorId(
      result.floorId ? String(result.floorId) : null
    );

    setIsFloorOverridden(true);

    setPoiList(result.availablePois || []);

    setGraphData(result.graphData || null);

    setCurrentLocation(
      result.locationName || "Current Location"
    );

    // IMPORTANT
    setShowScanner(false);

    speak(
      `Position updated. You are at ${
        result.locationName || "current location"
      }`
    );

    console.log("✅ Scanner closed successfully");
  } catch (err: any) {
    console.error("❌ Critical scan failure:", err);

    alert(
      `Scanner failed:\n${
        err?.message || "Unknown error"
      }`
    );
  }
};
  return (
    <main className="fixed inset-0 h-screen w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Auto-detect floor via sensor (if not overridden by QR) */}
      <FloorDetector onFloor={(f) => {
        if (!isFloorOverridden) setFloorId(f.toString());
      }} />

      {/* HEADER SECTION */}
      <header className="h-16 shrink-0 px-6 flex justify-between items-center border-b border-white/10 bg-slate-900/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <Compass />
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/5 rounded-lg text-slate-400">
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          {/* Real-time Multi-Language System Toggle Switch */}
          <button 
            onClick={() => setLang(lang === "en" ? "ta" : "en")} 
            className="flex items-center gap-1.5 p-2 bg-blue-600/10 hover:bg-blue-600/20 active:scale-95 border border-blue-500/30 rounded-lg text-blue-400 font-bold text-xs transition-all"
          >
            <Languages size={14} />
            <span>{lang === "en" ? "தமிழ்" : "EN"}</span>
          </button>
        </div>

        <div className="text-center max-w-[40%]">
          <h1 className="text-[10px] font-bold tracking-[0.4em] text-blue-400 uppercase">VAZHIKATTI</h1>
          <p className="text-[9px] text-slate-400 font-medium truncate uppercase">{t(currentLocation)}</p>
        </div>

        <button onClick={() => window.location.reload()} className="text-slate-400">
          <RotateCcw size={18} />
        </button>
      </header>

      {/* INTERACTIVE MAP AREA */}
      <div className="flex-1 relative w-full overflow-hidden z-10">
        <MapOverlay 
          poiList={poiList} 
          userPos={scannedNode ? { x: scannedNode.x, y: scannedNode.y } : null}
          targetPos={targetNode ? { x: targetNode.x, y: targetNode.y } : undefined}
          path={pathCoords}
          rotation={rotation}
        />

        {/* Floating Scanner Button */}
        {scannedNode && !showScanner && (
          <button 
            onClick={() => setShowScanner(true)}
            className="absolute top-4 right-4 z-40 p-3 bg-blue-600 rounded-full shadow-lg border border-white/20 active:scale-95 transition-all"
          >
            <Camera size={20} className="text-white" />
          </button>
        )}

        {/* Initial Scan Prompt */}
        {!scannedNode && !showScanner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-slate-950/80 backdrop-blur-sm z-20">
            <Navigation size={48} className="text-blue-500 animate-pulse" />
            <button 
              onClick={() => setShowScanner(true)}
              className="px-8 py-3 bg-blue-600 rounded-xl font-bold shadow-2xl tracking-wide text-sm"
            >
              {t("Scan QR to Start")}
            </button>
          </div>
        )}
      </div>

      {/* NAVIGATION & SEARCH DRAWER */}
      {scannedNode && (
        <footer className="shrink-0 p-6 bg-slate-900 border-t border-white/10 z-30 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {!targetNode || isSearching ? (
            <div className="space-y-4">
              <div className="relative">
                <input 
                  autoFocus={isSearching}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("Search Departments...")}
                  className="w-full p-4 bg-white/5 rounded-xl border border-white/10 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500 text-sm"
                  onFocus={() => setIsSearching(true)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                {(isSearching || searchQuery) && (
                  <button 
                    onClick={() => {
                      setIsSearching(false);
                      setSearchQuery("");
                    }} 
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X size={18} className="text-slate-500" />
                  </button>
                )}
              </div>
              {isSearching && (
                <div className="max-h-48 overflow-y-auto space-y-2 mt-2 custom-scrollbar">
                   {filteredPoiList.length > 0 ? filteredPoiList.map((poi) => (
                      <button 
                        key={poi.id}
                        onClick={() => { 
                          setTargetNode({id: poi.nodeId, x: poi.x, y: poi.y}); 
                          setIsSearching(false); 
                          setSearchQuery("");
                          speak(`Routing path to ${poi.name}`);
                        }} 
                        className="w-full p-4 text-left bg-white/5 hover:bg-white/10 active:bg-blue-600/20 rounded-xl text-sm border border-white/5 transition-colors"
                      >
                        {poi.name}
                      </button>
                   )) : (
                     <div className="p-4 text-center text-slate-500 text-xs italic">
                        {t("No destinations match your search.")}
                     </div>
                   )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400 tracking-wide uppercase">
                  {t("Active Navigation")}
                </span>
                <button 
                  onClick={() => { setTargetNode(null); setPathCoords([]); }}
                  className="p-1 hover:bg-white/10 rounded-md"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>
              <NavigationSteps 
                hospitalId={hospitalId || ""} 
                floorId={floorId ? String(floorId) : ""}
                startNodeId={scannedNode.id ? String(scannedNode.id) : ""}
                endNodeId={targetNode.id ? String(targetNode.id) : ""}
                graphData={graphData}
                lang={lang}
                onStepUpdate={handleStepUpdate}
                onPathUpdate={handlePathUpdate}
              />
            </div>
          )}
        </footer>
      )}

      {/* FULLSCREEN SCANNER OVERLAY */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black">
          <QRAnchorScanner onDetect={handleQRDetect} />
          <button 
            onClick={() => setShowScanner(false)} 
            className="absolute top-10 right-6 p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      )}
    </main>
  );
}
