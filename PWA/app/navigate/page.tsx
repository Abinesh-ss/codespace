"use client";

import { useState, useEffect } from "react";
import { Search, RotateCcw, MapPin, X, Camera, Navigation, ChevronRight } from "lucide-react";

// QR scanner and navigation components
import QRAnchorScanner from "@/components/QRAnchorScanner";
import NavigationSteps from "@/components/NavigationSteps";

interface POI {
  id: string;
  name: string;
  type: string;
  map: { name: string };
}

interface ScanResponse {
  nodeId: string;
  locationName: string;
  floorId: string;
}

export default function NavigatePage() {
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Logic states
  const [currentLocation, setCurrentLocation] = useState("Scan QR to Begin");
  const [scannedNodeId, setScannedNodeId] = useState<string | undefined>();
  const [targetNodeId, setTargetNodeId] = useState<string | undefined>();
  const [floorId, setFloorId] = useState<string | undefined>("1");

  // POIs fetched from backend
  const [poiList, setPoiList] = useState<POI[]>([]);

  // Replace with the real hospital ID from your DB
  const hospitalId = "hospital_1";

  // Fetch POIs from backend
  useEffect(() => {
    const fetchPOIs = async () => {
      try {
        const res = await fetch(`/api/hospital/${hospitalId}/locations`);
        if (!res.ok) throw new Error("Failed to fetch POIs");
        const data: POI[] = await res.json();
        setPoiList(data);
      } catch (err) {
        console.error("Failed to fetch POIs:", err);
        setPoiList([]);
      }
    };
    fetchPOIs();
  }, [hospitalId]);

  const handleReset = () => {
    setScannedNodeId(undefined);
    setTargetNodeId(undefined);
    setCurrentLocation("Scan QR to Begin");
    setShowScanner(false);
    setIsSearching(false);
  };

  /**
   * ✅ FIXED: Resolve QR URL → backend → real location
   */
  const handleQRDetect = async (data: any) => {
    try {
      const scanUrl = typeof data === "string" ? data : data?.data;
      if (!scanUrl) throw new Error("Invalid QR data");

      const res = await fetch(scanUrl);
      if (!res.ok) throw new Error("Failed to resolve scan");

      const location: ScanResponse = await res.json();

      setScannedNodeId(location.nodeId);
      setFloorId(location.floorId);
      setCurrentLocation(location.locationName);
      setShowScanner(false);
    } catch (error) {
      console.error("QR scan resolve failed:", error);
      setCurrentLocation("Unknown location");
      setShowScanner(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="h-16 px-6 grid grid-cols-3 items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div />
        <div className="flex justify-center">
          <span className="text-sm font-black tracking-[0.3em] text-blue-500 uppercase">HOSPINAV</span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-all active:scale-95"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto w-full gap-12">
        {/* QR Scanner */}
        <div className="w-full flex flex-col items-center gap-8">
          {showScanner ? (
            <div className="relative w-full aspect-square overflow-hidden rounded-[2.5rem] border-2 border-blue-500 shadow-2xl shadow-blue-500/20 bg-black">
              <QRAnchorScanner onDetect={handleQRDetect} />
              <button
                onClick={() => setShowScanner(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/60 text-white rounded-full backdrop-blur-md"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 w-full text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-full" />
                <div className="relative p-8 rounded-full bg-slate-900 border border-blue-500/20 text-blue-500 shadow-2xl">
                  <MapPin size={64} strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-black">
                  Current Position
                </p>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {currentLocation}
                </h2>
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95"
              >
                <Camera size={20} /> Open Scanner
              </button>
            </div>
          )}
        </div>

        {/* Search Button */}
        {!targetNodeId && !showScanner && (
          <button
            onClick={() => setIsSearching(true)}
            className="w-full flex items-center justify-between px-6 py-5 rounded-3xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <Search className="text-blue-500" size={24} />
              <span className="font-semibold text-lg">Where to?</span>
            </div>
            <ChevronRight className="opacity-30 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </section>

      {/* Navigation Panel */}
      {targetNodeId && (
        <section className="p-6 bg-slate-900 border-t border-white/10 rounded-t-[3rem] animate-in slide-in-from-bottom duration-500 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">
                  Destination
                </p>
                <h4 className="text-xl font-bold">{targetNodeId}</h4>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Navigation size={24} className="text-blue-500" />
              </div>
            </div>
            <div className="bg-white/5 rounded-3xl p-2 border border-white/5">
              <NavigationSteps
                startNodeId={scannedNodeId}
                endNodeId={targetNodeId}
                floorId={floorId}
              />
            </div>
          </div>
        </section>
      )}

      {/* Search Modal */}
      {isSearching && (
        <div className="fixed inset-0 z-[100] bg-[#020617]/98 backdrop-blur-3xl p-8 flex flex-col pt-24 items-center">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-4 bg-slate-900 border border-white/10 p-5 rounded-[2rem] shadow-2xl focus-within:border-blue-500 transition-all">
              <Search className="text-slate-500" size={24} />
              <input
                autoFocus
                placeholder="Find a department..."
                className="flex-1 bg-transparent border-none outline-none text-xl text-white placeholder:text-slate-700"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) {
                    setTargetNodeId(e.currentTarget.value);
                    setIsSearching(false);
                  }
                }}
                list="poi-options"
              />
              <datalist id="poi-options">
                {poiList.map((poi) => (
                  <option key={poi.id} value={poi.name} />
                ))}
              </datalist>
              <button onClick={() => setIsSearching(false)} className="p-2 text-slate-500">
                <X size={20} />
              </button>
            </div>
            <div className="mt-12 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                Frequent Destinations
              </p>
              <div className="grid grid-cols-1 gap-2">
                {poiList.slice(0, 4).map((poi) => (
                  <button
                    key={poi.id}
                    onClick={() => {
                      setTargetNodeId(poi.id);
                      setIsSearching(false);
                    }}
                    className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-blue-600 hover:border-blue-400 transition-all group"
                  >
                    <span className="font-bold">{poi.name}</span>
                    <Navigation
                      size={18}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

