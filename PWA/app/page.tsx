'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LiveLocation } from '../../components/LiveLocation';
import { MapNode } from '../../lib/types';

// Multi-lingual Translation Resource Dictionaries
const translations: Record<string, Record<string, string>> = {
  en: {
    title: "Live Tracking Route",
    navigatingTo: "Navigating to",
    subtitle: "Continuous pathlines draw automatically. Follow alignment arrow indicator.",
    recalibrate: "Recalibrate to Anchor QR",
    loading: "Calculating continuous corridor path routes...",
    errorTitle: "Routing Error",
    stepsTitle: "Turn-by-Turn Directions",
    goStraight: "Go straight down the hallway",
    turnRight: "Turn right at the intersection",
    turnLeft: "Turn left at the intersection",
    arrive: "Arrive at your destination:",
    langLabel: "Language"
  },
  ta: {
    title: "நேரடி வழி கண்காணிப்பு",
    navigatingTo: "செல்லும் இடம்",
    subtitle: "பாதை கோடுகள் தானாகவே வரையப்படும். அம்பு குறியீட்டைப் பின்தொடரவும்.",
    recalibrate: "QR குறியீட்டிற்கு மறுசீரமைக்கவும்",
    loading: "பாதை கணக்கிடப்படுகிறது...",
    errorTitle: "வழிசெலுத்தல் பிழை",
    stepsTitle: "வழிமுறைகள்",
    goStraight: "நேராக நடைபாதையில் செல்லவும்",
    turnRight: "சந்தியில் வலதுபுறம் திரும்பவும்",
    turnLeft: "சந்தியில் இடதுபுறம் திரும்பவும்",
    arrive: "இலக்கை அடைந்தீர்கள்:",
    langLabel: "மொழி"
  }
};

function NavigationRuntime() {
  const searchParams = useSearchParams();
  const floorId = searchParams.get('floorId');
  const startNodeId = searchParams.get('startNodeId');
  const endNodeId = searchParams.get('endNodeId');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Feature: Language Translation State
  const [language, setLanguage] = useState<string>('en');

  // Position coordinates state loop
  const [userPos, setUserPos] = useState({ x: 0, y: 0 });
  const [heading, setHeading] = useState<number>(0);
  const [activePath, setActivePath] = useState<MapNode[]>([]);

  useEffect(() => {
    async function fetchNavigationRoute() {
      if (!floorId || !startNodeId || !endNodeId) {
        // Fallback default parameters to keep layout active
        const fallbackPath: MapNode[] = [
          { id: 'start_node', type: 'intersection', x: 20, y: 80 },
          { id: 'turn_1', type: 'corridor', x: 20, y: 40 },
          { id: 'turn_2', type: 'corridor', x: 70, y: 40 },
          { id: 'destination', type: 'room', x: 70, y: 15, name: 'Main Ward Emergency Room' }
        ];
        setActivePath(fallbackPath);
        setUserPos({ x: fallbackPath[0].x, y: fallbackPath[0].y });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        const response = await fetch(
          `${backendBase}/api/navigation/shortest-path?floorId=${floorId}&startNodeId=${startNodeId}&endNodeId=${endNodeId}`
        );
        const data = await response.json();

        if (data.success && data.path && data.path.length > 0) {
          setActivePath(data.path);
          setUserPos({ x: data.path[0].x, y: data.path[0].y });
          setErrorMessage(null);
        } else {
          setErrorMessage(data.error || 'Failed to resolve continuous pathway logic.');
        }
      } catch (err) {
        console.error("Navigation API retrieval crash:", err);
        setErrorMessage('Failed to connect to backend routing service.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNavigationRoute();
  }, [floorId, startNodeId, endNodeId]);

  const targetDestination = activePath[activePath.length - 1];
  const polylinePoints = activePath.map((node) => `${node.x},${node.y}`).join(' ');
  const t = translations[language] || translations['en'];

  // Feature: Dynamic Turn-by-Turn Text Generation Math
  const generateDirections = () => {
    if (activePath.length < 2) return [];
    const directionsList = [];
    
    for (let i = 0; i < activePath.length - 1; i++) {
      const current = activePath[i];
      const next = activePath[i + 1];
      
      if (next.type === 'room' && i === activePath.length - 2) {
        directionsList.push(`${t.arrive} ${next.name || 'Destination'}`);
      } else if (i > 0) {
        const prev = activePath[i - 1];
        // Cross-product math to calculate physical left/right turn angles down corridors
        const dx1 = current.x - prev.x;
        const dy1 = current.y - prev.y;
        const dx2 = next.x - current.x;
        const dy2 = next.y - current.y;
        const crossProduct = dx1 * dy2 - dy1 * dx2;

        if (Math.abs(crossProduct) > 5) {
          directionsList.push(crossProduct > 0 ? t.turnRight : t.turnLeft);
        } else {
          directionsList.push(t.goStraight);
        }
      } else {
        directionsList.push(t.goStraight);
      }
    }
    // Remove consecutive duplicates for cleaner UI reading
    return directionsList.filter((item, index, self) => self.indexOf(item) === index);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full bg-slate-950 items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Upper Navigation Header Bar + Language Selector Toggle */}
      <div className="p-5 bg-slate-900 border-b border-slate-800 shadow-xl z-10 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">{t.navigatingTo}</span>
          <h1 className="text-xl font-extrabold truncate mt-0.5">
            {errorMessage ? t.errorTitle : (targetDestination?.name || 'Hospital Location Point')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">{errorMessage ? errorMessage : t.subtitle}</p>
        </div>
        
        {/* Language Selection Interface Feature */}
        <div className="ml-4 bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t.langLabel}:</span>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-xs font-bold text-blue-400 outline-none cursor-pointer"
          >
            <option value="en" className="bg-slate-900 text-white">English</option>
            <option value="ta" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
          </select>
        </div>
      </div>

      {/* Main Working Layout Split: Canvas View Top, Directions Drawer Bottom */}
      <div className="flex-1 flex flex-col md:flex-row relative bg-slate-950 overflow-hidden">
        
        {/* Vector Tracking Map View Canvas Section */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          <div className="w-full max-w-md aspect-square bg-slate-900 rounded-2xl shadow-2xl relative border border-slate-800 overflow-hidden">
            
            {/* Compass HUD Heading Ring Background Overlay Feature */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
              <div 
                className="w-4/5 h-4/5 rounded-full border-4 border-dashed border-slate-400 flex items-center justify-center transition-transform duration-100 ease-out"
                style={{ transform: `rotate(${-heading}deg)` }}
              >
                <div className="absolute top-2 font-black text-xs text-white">N</div>
                <div className="absolute right-2 font-black text-xs text-white">E</div>
                <div className="absolute bottom-2 font-black text-xs text-white">S</div>
                <div className="absolute left-2 font-black text-xs text-white">W</div>
              </div>
            </div>

            <svg 
              className="w-full h-full absolute inset-0 select-none" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              {/* Plain Grid Background Pattern Accent Lines */}
              <defs>
                <pattern id="canvas-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.15" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#canvas-grid)" />

              {/* 1. CONTINUOUS CORRIDOR drawn path lines */}
              {activePath.length > 1 && (
                <>
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-25"
                  />
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="1.0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* 2. ROUTE CHECKPOINT HIERARCHY DOTS */}
              {activePath.map((node, index) => {
                if (index === 0 || index === activePath.length - 1) return null;
                return (
                  <circle
                    key={node.id || index}
                    cx={node.x}
                    cy={node.y}
                    r="0.8"
                    className="fill-slate-800 stroke-blue-500 stroke-[0.3]"
                  />
                );
              })}

              {/* 3. FINAL DESTINATION PIN LOCATION CHECKPOINT */}
              {targetDestination && (
                <g transform={`translate(${targetDestination.x}, ${targetDestination.y})`}>
                  <circle r="3.5" className="fill-emerald-500/30 animate-pulse" />
                  <circle r="1.5" className="fill-emerald-500 stroke-slate-900 stroke-[0.4]" />
                </g>
              )}

              {/* 4. RE-ESTABLISHED COMPASS DIRECTION OVERLAY BEACON CONE */}
              <g transform={`translate(${userPos.x}, ${userPos.y})`}>
                <circle r="4.5" className="fill-blue-500/20 animate-ping" />
                
                {/* Visual Heading Pointer Wedge */}
                <path
                  d="M 0 0 L -1.8 -4.5 A 4.5 4.5 0 0 1 1.8 -4.5 Z"
                  className="fill-blue-400/60 transition-transform duration-75 ease-out"
                  transform={`rotate(${heading})`}
                />
                
                <circle r="1.2" className="fill-blue-500 stroke-white stroke-[0.35] shadow-lg" />
              </g>
            </svg>

            {/* Hardware Pedometer + Compass Sensor Sync Pipeline */}
            {activePath.length > 0 && (
              <LiveLocation
                initialX={activePath[0].x}
                initialY={activePath[0].y}
                activePath={activePath}
                onPositionUpdate={(pos) => setUserPos(pos)}
                heading={heading}
                setHeading={setHeading}
              />
            )}
          </div>
        </div>

        {/* Feature: Dynamic Direction instructions sidebar/drawer drawer panel */}
        {!errorMessage && activePath.length > 1 && (
          <div className="w-full md:w-64 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 overflow-y-auto max-h-40 md:max-h-none shadow-2xl">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2.5">
              {t.stepsTitle}
            </h3>
            <div className="space-y-2">
              {generateDirections().map((step, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-2.5 p-2 rounded-lg text-xs font-medium ${
                    index === 0 ? 'bg-blue-950/40 text-blue-300 border border-blue-900/30' : 'text-slate-300'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-slate-400 shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="leading-tight">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Calibration Bar Control Panel Drawer */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 text-center flex gap-3 justify-center z-10 shadow-inner">
        <button 
          onClick={() => {
            if (activePath.length > 0) {
              setUserPos({ x: activePath[0].x, y: activePath[0].y });
            }
          }}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold rounded-xl border border-slate-700 transition"
        >
          {t.recalibrate}
        </button>
      </div>
    </div>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full bg-slate-950 items-center justify-center text-white text-sm">
        Initializing spatial navigation maps...
      </div>
    }>
      <NavigationRuntime />
    </Suspense>
  );
}
