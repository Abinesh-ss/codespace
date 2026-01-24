"use client";

import { useState, useEffect } from "react";
import {
  Search,
  RotateCcw,
  MapPin,
  X,
  Camera,
  ChevronRight,
} from "lucide-react";

import QRAnchorScanner from "@/components/QRAnchorScanner";
import NavigationSteps from "@/components/NavigationSteps";
import Compass from "@/components/Compass";
import FloorDetector from "@/components/FloorDetector";
import LiveLocation from "@/components/LiveLocation";

interface POI {
  id: string;
  name: string;
  qrId: string;
  nodeId: string;
  type?: string;
  floorId: string;
}

export default function NavigatePage() {
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState("Scan QR to Begin");

  const [scannedNodeId, setScannedNodeId] = useState<string>();
  const [targetNodeId, setTargetNodeId] = useState<string>();
  const [floorId, setFloorId] = useState<string>("1");
  const [poiList, setPoiList] = useState<POI[]>([]);

  const [scanLocked, setScanLocked] = useState(false);

  /* ---------- INIT HOSPITAL ---------- */
  useEffect(() => {
    fetch("/api/hospital/active")
      .then((r) => r.json())
      .then((d) => d?.id && setHospitalId(d.id))
      .catch((err) => console.error("Hospital Fetch Error:", err));
  }, []);

  /* ---------- FETCH POIs (FIXED, LOGIC UNCHANGED) ---------- */
  useEffect(() => {
    if (!hospitalId) return;

    fetch(`/api/hospital/${hospitalId}/locations`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.locations) {
          setPoiList([]);
          return;
        }

        // ✅ ONLY FIX: flatten locations[].pois → POI[]
        const pois: POI[] = d.locations.flatMap((loc: any) =>
          loc.pois.map((poi: any) => ({
            id: poi.id,
            name: poi.name,
            qrId: poi.qrId,
            nodeId: poi.nodeId,
            type: poi.type,
            floorId: poi.floor?.level?.toString() ?? "1",
          }))
        );

        setPoiList(pois);
      })
      .catch((err) => console.error("POI Fetch Error:", err));
  }, [hospitalId]);

  /* ---------- RESET ---------- */
  const handleReset = () => {
    setScannedNodeId(undefined);
    setTargetNodeId(undefined);
    setCurrentLocation("Scan QR to Begin");
    setShowScanner(false);
    setIsSearching(false);
    setSearchQuery("");
  };

  /* ---------- QR DETECT ---------- */
  const handleQRDetect = async (data: any) => {
    if (scanLocked) return;
    setScanLocked(true);

    try {
      const raw = typeof data === "string" ? data : data?.data || data?.url;
      if (!raw) return;

      const qrId = raw.includes("/api/scan/")
        ? raw.split("/api/scan/")[1]
        : raw;

      const res = await fetch(`/api/scan/${qrId}`);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Scan API Error:", errorData);
        return;
      }

      const result = await res.json();
      setScannedNodeId(result.nodeId);
      setFloorId(result.floorId);
      setCurrentLocation(result.locationName);
      setShowScanner(false);
    } catch (err) {
      console.error("QR scan network error:", err);
    } finally {
      setTimeout(() => setScanLocked(false), 2000);
    }
  };

  /* ---------- FLOOR-AWARE POIs ---------- */
  const floorPOIs = poiList.filter((p) => p.floorId === floorId);

  const filteredPOIs = floorPOIs.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ================== JSX ================== */
  return (
    <main className="h-screen w-full bg-[#020617] text-slate-100 flex flex-col">
      <FloorDetector onFloor={(f) => setFloorId(f.toString())} />

      {/* HEADER */}
      <header className="h-16 px-6 grid grid-cols-3 items-center border-b border-white/5 bg-slate-900/50">
        <Compass />
        <div className="text-center text-xs font-bold text-blue-400">
          Vazhikatti
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-10 max-w-md mx-auto w-full">
        {showScanner ? (
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/10">
            <QRAnchorScanner onDetect={handleQRDetect} />
            <button
              onClick={() => setShowScanner(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-3">
              <div className="relative inline-block">
                <MapPin
                  size={48}
                  className="mx-auto text-blue-500 animate-pulse"
                />
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {currentLocation}
              </h2>
              <LiveLocation />
            </div>

            <button
              onClick={() => setShowScanner(true)}
              className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all rounded-full font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Camera size={20} />
              <span>Open Scanner</span>
            </button>
          </>
        )}

        {!targetNodeId && !showScanner && (
          <div className="mt-8 space-y-4">
            {!isSearching ? (
              <button
                onClick={() => setIsSearching(true)}
                className="w-full p-5 bg-slate-900/50 border border-white/5 rounded-2xl flex justify-between items-center hover:border-blue-500/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Search
                    size={20}
                    className="text-slate-400 group-hover:text-blue-400"
                  />
                  <span className="text-slate-300">Where to?</span>
                </div>
                <ChevronRight size={20} className="text-slate-500" />
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-4 pl-12 rounded-xl bg-slate-900 border border-blue-500/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Search department..."
                  />
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    size={18}
                  />
                  <button
                    onClick={() => setIsSearching(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-3 space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredPOIs.length > 0 ? (
                    filteredPOIs.map((poi) => (
                      <button
                        key={poi.id}
                        onClick={() => {
                          setTargetNodeId(poi.nodeId);
                          setIsSearching(false);
                        }}
                        className="w-full p-4 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl text-left transition-all active:scale-[0.99]"
                      >
                        <div className="font-medium text-slate-100">
                          {poi.name}
                        </div>
                        {poi.type && (
                          <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                            {poi.type}
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No locations found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NAVIGATION OVERLAY */}
      {targetNodeId && scannedNodeId && (
        <div className="border-t border-white/5 p-4 bg-slate-900/90 backdrop-blur-xl animate-in slide-in-from-bottom duration-500">
          <div className="max-w-md mx-auto">
            <NavigationSteps
              startNodeId={scannedNodeId}
              endNodeId={targetNodeId}
              floorId={floorId}
              hospitalId={hospitalId!}
            />
          </div>
        </div>
      )}
    </main>
  );
}

