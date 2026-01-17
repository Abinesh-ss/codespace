"use client";

import { useState, useEffect } from "react";
import { Search, RotateCcw, MapPin, X, Camera, Navigation, ChevronRight } from "lucide-react";
import QRAnchorScanner from "@/components/QRAnchorScanner";
import NavigationSteps from "@/components/NavigationSteps";

interface POI {
  id: string;
  name: string;
  type?: string;
}

export default function NavigatePage() {
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Logic states
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState("Scan QR to Begin");
  const [scannedNodeId, setScannedNodeId] = useState<string | undefined>();
  const [targetNodeId, setTargetNodeId] = useState<string | undefined>();
  const [floorId, setFloorId] = useState<string | undefined>("1");

  const [poiList, setPoiList] = useState<POI[]>([]);

  // 1. Automatically fetch the Hospital CUID on load
  useEffect(() => {
    async function initHospital() {
      try {
        const res = await fetch("/api/hospital/active");
        const data = await res.json();
        if (data && data.id) {
          setHospitalId(data.id);
          console.log("Found Hospital CUID:", data.id);
        }
      } catch (err) {
        console.error("Discovery error:", err);
      }
    }
    initHospital();
  }, []);

  // 2. Fetch POIs only after hospitalId is set
  useEffect(() => {
    if (!hospitalId) return;

    const fetchPOIs = async () => {
      try {
        const res = await fetch(`/api/hospital/${hospitalId}/locations`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        const list = Array.isArray(data) ? data : data.locations || [];
        setPoiList(list);
      } catch (err) {
        console.error("POI Fetch Error:", err);
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
    setSearchQuery("");
  };

  const handleQRDetect = async (data: any) => {
    try {
      const scanUrl = typeof data === "string" ? data : data?.data || data?.url;
      let targetPath = scanUrl;
      if (scanUrl.includes('/api/scan/')) {
        targetPath = '/api/scan/' + scanUrl.split('/api/scan/')[1];
      }
      const res = await fetch(targetPath);
      const location = await res.json();
      setScannedNodeId(location.nodeId);
      setFloorId(location.floorId);
      setCurrentLocation(location.locationName);
      setShowScanner(false);
    } catch (error) {
      console.error("QR Error:", error);
    }
  };

  // Real-time filtering logic
  const filteredPOIs = poiList.filter(poi => 
    poi.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <header className="h-16 px-6 grid grid-cols-3 items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div />
        <div className="flex justify-center">
          <span className="text-sm font-black tracking-[0.3em] text-blue-500 uppercase">Vazhikatti</span>
        </div>
        <div className="flex justify-end">
          <button onClick={handleReset} className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-all">
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full gap-8">
        {/* QR Scanner Section */}
        <div className="w-full flex flex-col items-center gap-8">
          {showScanner ? (
            <div className="relative w-full aspect-square overflow-hidden rounded-[2.5rem] border-2 border-blue-500 bg-black">
              <QRAnchorScanner onDetect={handleQRDetect} />
              <button onClick={() => setShowScanner(false)} className="absolute top-4 right-4 z-10 p-2 bg-black/60 text-white rounded-full"><X size={20} /></button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 w-full text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-full" />
                <div className="relative p-8 rounded-full bg-slate-900 border border-blue-500/20 text-blue-500">
                  <MapPin size={64} strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-black">Current Position</p>
                <h2 className="text-3xl font-bold text-white">{currentLocation}</h2>
              </div>
              <button onClick={() => setShowScanner(true)} className="flex items-center gap-3 px-8 py-4 rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95">
                <Camera size={20} /> Open Scanner
              </button>
            </div>
          )}
        </div>

        {/* SEARCH SECTION */}
        {!targetNodeId && !showScanner && (
          <div className="w-full space-y-4">
            {!isSearching ? (
              <button
                onClick={() => setIsSearching(true)}
                className="w-full flex items-center justify-between px-6 py-5 rounded-3xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Search className="text-blue-500" size={24} />
                  <span className="font-semibold text-lg">Where to?</span>
                </div>
                <ChevronRight className="opacity-30 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <div className="w-full animate-in fade-in slide-in-from-top-4 duration-300">
                {/* Forced White Text Input */}
                <div className="flex items-center gap-4 bg-slate-900 border border-blue-500/50 p-5 rounded-[2rem] shadow-2xl">
                  <Search className="text-blue-500" size={24} />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search department..."
                    className="flex-1 bg-transparent border-none outline-none text-xl !text-white placeholder:text-slate-600 caret-white w-full"
                    style={{ 
                      color: 'white', 
                      WebkitTextFillColor: 'white',
                      appearance: 'none'
                    }}
                  />
                  <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="p-2 text-slate-400"><X size={20} /></button>
                </div>

                {/* Destinations List */}
                <div className="mt-6 space-y-4 max-h-[40vh] overflow-y-auto">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                    {searchQuery ? "Search Results" : "Available Destinations"}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {filteredPOIs.length > 0 ? (
                      filteredPOIs.slice(0, 10).map((poi) => (
                        <button
                          key={poi.id}
                          onClick={() => {
                            setTargetNodeId(poi.name);
                            setIsSearching(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-blue-600/20 hover:border-blue-500/40 transition-all text-left"
                        >
                          <span className="font-bold !text-white">{poi.name}</span>
                          <Navigation size={18} className="text-blue-500" />
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <p className="text-slate-500 text-sm">No destinations found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Navigation Steps Panel */}
      {targetNodeId && (
        <section className="p-6 bg-slate-900 border-t border-white/10 rounded-t-[3rem] animate-in slide-in-from-bottom duration-500 shadow-2xl">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Destination</p>
                <h4 className="text-xl font-bold !text-white">{targetNodeId}</h4>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Navigation size={24} className="text-blue-500" />
              </div>
            </div>
            <div className="bg-white/5 rounded-3xl p-2 border border-white/5">
              <NavigationSteps startNodeId={scannedNodeId} endNodeId={targetNodeId} floorId={floorId} />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
