"use client";

import React, { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface POI {
  id: string;
  name: string;
  category: string;
  floor: number;
  xRatio: number; // Stored as percentage (0-1) for dynamic image resizing
  yRatio: number;
}

export default function HospitalMapEditor() {
  const searchParams = useSearchParams();
  const mapId = searchParams.get("mapId") || "";

  const [floor, setFloor] = useState<number>(2);
  const [pois, setPois] = useState<POI[]>([
    { id: "1", name: "EN", category: "GENERAL", floor: 2, xRatio: 0.35, yRatio: 0.5 },
    { id: "2", name: "Room 2", category: "GENERAL", floor: 2, xRatio: 0.54, yRatio: 0.53 },
    { id: "3", name: "Room 3", category: "GENERAL", floor: 2, xRatio: 0.54, yRatio: 0.72 },
  ]);
  const [activePoiId, setActivePoiId] = useState<string | null>("1");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Click handler to drop a new POI marker directly onto the image
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    
    // Calculate clicked position relative to actual displayed image dimensions
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xRatio = clickX / rect.width;
    const yRatio = clickY / rect.height;

    const newPoi: POI = {
      id: crypto.randomUUID(),
      name: `Room ${pois.length + 1}`,
      category: "GENERAL",
      floor: floor,
      xRatio: Math.max(0, Math.min(1, xRatio)),
      yRatio: Math.max(0, Math.min(1, yRatio)),
    };

    setPois((prev) => [...prev, newPoi]);
    setActivePoiId(newPoi.id);
  };

  const updatePoiName = (id: string, newName: string) => {
    setPois((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const deletePoi = (id: string) => {
    setPois((prev) => prev.filter((item) => item.id !== id));
    if (activePoiId === id) setActivePoiId(null);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("http://localhost:3000/api/hospital/map/save-pois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapId, floor, pois }),
      });
      if (response.ok) {
        alert("Map changes saved successfully!");
      } else {
        alert("Failed to save changes.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-blue-600">Vazhikatti</span>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-semibold">
          <a href="#" className="hover:text-blue-600">Dashboard</a>
          <a href="#" className="hover:text-blue-600">Upload</a>
          <a href="#" className="text-blue-600">Editor</a>
          <a href="#" className="hover:text-blue-600">Navigate</a>
          <a href="#" className="hover:text-blue-600">QR</a>
        </nav>
      </header>

      {/* Editor Sub-Header Toolbar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b shadow-sm">
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-bold">HOSPITAL MAP EDITOR</h1>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 font-medium">Hospital Floor Plan</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-500 uppercase">FLOOR</span>
            <input
              type="number"
              value={floor}
              onChange={(e) => setFloor(Number(e.target.value))}
              className="w-12 px-2 py-1 border rounded text-center font-bold"
            />
          </div>

          <button className="px-4 py-2 bg-amber-100 text-amber-700 font-bold rounded-lg hover:bg-amber-200">
            ✨ AI SCAN
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
          >
            {isSaving ? "SAVING..." : "💾 SAVE CHANGES"}
          </button>

          <button className="px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800">
            QR GEN
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Interactive Canvas Area */}
        <div className="flex-1 p-6 relative overflow-auto flex items-center justify-center">
          <div
            ref={imageContainerRef}
            onClick={handleImageClick}
            className="relative cursor-crosshair border shadow-md bg-white rounded-lg overflow-hidden select-none"
            style={{ width: "800px", height: "550px" }}
          >
            {/* Base Image Upload */}
            <img
              src="/sample-floorplan.png"
              alt="Floor Plan"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Dynamic POI Markers Layer */}
            {pois.map((poi) => {
              const isActive = poi.id === activePoiId;
              return (
                <div
                  key={poi.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePoiId(poi.id);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-full cursor-pointer group"
                  style={{
                    left: `${poi.xRatio * 100}%`,
                    top: `${poi.yRatio * 100}%`,
                  }}
                >
                  <div className="flex flex-col items-center">
                    {/* Location Pin Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform ${
                        isActive ? "bg-blue-600 scale-125 ring-4 ring-blue-300" : "bg-slate-700 hover:scale-110"
                      }`}
                    >
                      📍
                    </div>
                    {/* Location Name Tag */}
                    <span className="mt-1 px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded shadow uppercase">
                      {poi.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Elements Sidebar */}
        <div className="w-80 bg-white border-l p-4 flex flex-col space-y-4 overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            ACTIVE ELEMENTS
          </h2>

          <div className="space-y-3">
            {pois.map((poi) => {
              const isActive = poi.id === activePoiId;
              return (
                <div
                  key={poi.id}
                  onClick={() => setActivePoiId(poi.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isActive ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={poi.name}
                      onChange={(e) => updatePoiName(poi.id, e.target.value)}
                      className="font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-blue-500 outline-none w-full mr-2"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePoi(poi.id);
                      }}
                      className="text-gray-400 hover:text-red-500 text-sm"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="mt-2 text-[10px] text-gray-400 font-semibold space-y-0.5">
                    <div>{poi.category}</div>
                    <div>FLOOR: {poi.floor}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
