"use client";

import React, { useState, useEffect } from "react";
import MapOverlay, { Node } from "@/components/MapOverlay";
import QRAnchorScanner from "@/components/QRAnchorScanner";
import LiveLocation from "@/components/LiveLocation";
import Compass from "@/components/Compass";
import { Search, MapPin, Navigation, QrCode, X, Globe } from "lucide-react";

export default function Home() {
  // Navigation & Location States
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [userLocation, setUserLocation] = useState<{ x: number; y: number } | null>(null);
  const [destination, setDestination] = useState<Node | null>(null);
  const [calculatedPath, setCalculatedPath] = useState<Array<{ x: number; y: number }>>([]);
  
  // Map Image & Floor States
  const [mapImageUrl, setMapImageUrl] = useState<string>("/uploads/floorplan-default.png");
  const [mapDimensions, setMapDimensions] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 1000,
  });

  // UI States
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "ta">("en");

  // Translation Dictionaries
  const translations = {
    en: {
      searchPlaceholder: "Search destination or POI...",
      scanQR: "Scan QR Anchor",
      selectDestination: "Select Destination",
      currentLocation: "Current Location",
      navigatingTo: "Navigating to",
      noResults: "No locations found",
      clear: "Clear Navigation",
    },
    ta: {
      searchPlaceholder: "இடத்தை பாருங்கள்...",
      scanQR: "QR குறியீட்டை ஸ்கேன் செய்",
      selectDestination: "இலக்கைத் தேர்ந்தெடுக்கவும்",
      currentLocation: "தற்போதைய இருப்பிடம்",
      navigatingTo: "செல்லும் இடம்",
      noResults: "இடங்கள் எதுவும் கிடைக்கவில்லை",
      clear: "வழிகாட்டலை முடித்ர",
    },
  };

  const t = translations[language];

  // 1. Fetch All POI Nodes & Current Floor Plan Image on Mount
  useEffect(() => {
    async function initializeMapData() {
      try {
        const nodesRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/nodes`);
        if (nodesRes.ok) {
          const nodesData = await nodesRes.json();
          if (Array.isArray(nodesData)) {
            setAllNodes(nodesData);
          }
        }

        const mapRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/map/current`);
        if (mapRes.ok) {
          const mapData = await mapRes.json();
          if (mapData.imageUrl) setMapImageUrl(mapData.imageUrl);
          if (mapData.width && mapData.height) {
            setMapDimensions({ width: mapData.width, height: mapData.height });
          }
        }
      } catch (error) {
        console.error("Error loading map layout or POI nodes:", error);
      }
    }

    initializeMapData();
  }, []);

  // 2. Calculate Shortest Path when Start/Destination Change
  useEffect(() => {
    async function fetchPath() {
      if (!userLocation || !destination) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/navigation/shortest-path`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              start: userLocation,
              end: { x: destination.x, y: destination.y },
            }),
          }
        );

        if (response.ok) {
          const pathData = await response.json();
          setCalculatedPath(pathData.path || []);
        }
      } catch (err) {
        console.error("Failed to calculate navigation route:", err);
      }
    }

    fetchPath();
  }, [userLocation, destination]);

  // Handle QR Scan Detection
  const handleQRScanned = (scannedData: { x: number; y: number; nodeName?: string }) => {
    setUserLocation({ x: scannedData.x, y: scannedData.y });
    setIsScannerOpen(false);
  };

  // Filtered POIs for Drawer Search
  const filteredNodes = allNodes.filter((node) =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-900 text-slate-100 flex flex-col">
      {/* Header Bar Controls */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Navigation className="w-6 h-6 text-blue-500" />
          <h1 className="font-bold text-lg tracking-wide">HospiNav Pro</h1>
        </div>

        <div className="flex items-center gap-3">
          <Compass />
          
          <button
            onClick={() => setLanguage((prev) => (prev === "en" ? "ta" : "en"))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1 text-xs font-semibold"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Map Viewport */}
      <div className="relative flex-1 w-full h-full pt-16 pb-20">
        <MapOverlay
          mapImageUrl={mapImageUrl}
          imageDimensions={mapDimensions}
          nodes={allNodes}
          path={calculatedPath}
          userLocation={userLocation}
          destination={destination}
        />

        {/* Floating Controls */}
        <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-3">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition flex items-center justify-center"
            title={t.scanQR}
          >
            <QrCode className="w-6 h-6" />
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg transition flex items-center justify-center border border-slate-700"
            title={t.selectDestination}
          >
            <Search className="w-6 h-6 text-blue-400" />
          </button>
        </div>
      </div>

      {/* Live Active Navigation Guidance Panel */}
      {calculatedPath.length > 0 && destination && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">{t.navigatingTo}</div>
              <div className="font-bold text-base text-slate-100">{destination.name}</div>
              <div className="text-xs text-blue-400">
                {calculatedPath.length} checkpoint segments
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setCalculatedPath([]);
              setDestination(null);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            {t.clear}
          </button>
        </div>
      )}

      {/* Live Sensor Location Dead-Reckoning (Compatible Props) */}
      <LiveLocation
        userPos={userLocation}
        setUserPos={setUserLocation}
      />

      {/* Search & POI Selection Drawer */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-md font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                {t.selectDestination}
              </h2>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Search Box */}
            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* POI List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredNodes.length > 0 ? (
                filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      setDestination(node);
                      setIsSearchOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between ${
                      destination?.id === node.id
                        ? "bg-blue-600/20 border border-blue-500/50 text-blue-400"
                        : "hover:bg-slate-800/60 text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{node.name}</div>
                      <div className="text-xs text-slate-400">
                        Floor: {node.floor || "1"} • Node: {node.id}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-blue-400">
                      Select
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm">
                  {t.noResults}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <QRAnchorScanner
          onScanSuccess={handleQRScanned}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </main>
  );
}
