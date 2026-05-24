"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp, ArrowUpLeft, ArrowUpRight, CheckCircle2 }  from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

interface Props {
  startNodeId: string;
  endNodeId: string;
  floorId: string;
  hospitalId: string;
  graphData: any;
  lang?: "en" | "ta";
  onStepUpdate: (text: string) => void;
  onPathUpdate: (coords: { x: number; y: number }[]) => void;
}

const TXT = {
  en: { start: "Start moving", straight: "Go straight", left: "Turn left", right: "Turn right", end: "You have arrived" },
  ta: { start: "பயணத்தைத் தொடங்குங்கள்", straight: "நேராகச் செல்லுங்கள்", left: "இடதுபுறம் திரும்புங்கள்", right: "வலதுபுறம் திரும்புங்கள்", end: "இலக்கை அடைந்துவிட்டீர்கள்" }
};

export default function NavigationSteps({
  startNodeId,
  endNodeId,
  floorId,
  hospitalId,
  lang = "en", // 🌟 FIXED: Changed default value from "ta" to "en" to align with parent engine
  onStepUpdate,
  onPathUpdate
}: Props) {
  const [steps, setSteps] = useState<{ textEn: string; textTa: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const lastSpokenRef = useRef("");
  const parametersKey = `${startNodeId}-${endNodeId}-${floorId}-${hospitalId}`;

  useEffect(() => {
    console.log("⚓ Navigation Payload Tracked:", { startNodeId, endNodeId, floorId, hospitalId });

    if (!startNodeId || startNodeId === "undefined" || startNodeId === "null") return;
    if (!endNodeId || endNodeId === "undefined" || endNodeId === "null") return;

    let isMounted = true;

    async function getRoute() {
      setLoading(true);
      setErrorMessage(null);
      setSteps([]); 

      try {
        console.log("🌐 Triggering Shortest-Path Request to Server...");
        console.log("🌐 Navigation API:", `${API_BASE}/api/navigation/shortest-path`);
        
        const res = await fetch(`${API_BASE}/api/navigation/shortest-path`, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            hospitalId: hospitalId, 
            floorId: String(floorId), 
            startNodeId: String(startNodeId), 
            endNodeId: String(endNodeId) 
          })
        });

        if (!res.ok) {
          throw new Error(`API responded with status code: ${res.status}`);
        }

        const data = await res.json();
        console.log("📦 Route API Success Payload:", data);
        
        if (!isMounted) return;

        if (data && data.path && data.path.length > 0) {
          const path = data.path.map((p: any) => ({ 
            x: parseFloat(p.x || 0), 
            y: parseFloat(p.y || 0) 
          }));

          onPathUpdate(path);

          const generated = [];
          generated.push({ textEn: TXT.en.start, textTa: TXT.ta.start, type: "start" });

          for (let i = 0; i < path.length - 2; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            const p3 = path[i + 2];

            const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
            let diff = (angle2 - angle1) * (180 / Math.PI);

            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;

            if (diff < -30) {
              generated.push({ textEn: TXT.en.left, textTa: TXT.ta.left, type: "left" });
            } else if (diff > 30) {
              generated.push({ textEn: TXT.en.right, textTa: TXT.ta.right, type: "right" });
            } else if (i % 4 === 0) { 
              generated.push({ textEn: TXT.en.straight, textTa: TXT.ta.straight, type: "straight" });
            }
          }

          generated.push({ textEn: TXT.en.end, textTa: TXT.ta.end, type: "end" });
          setSteps(generated);

          const immediateInstruction = generated[0];
          if (immediateInstruction) {
            // Send English string up to parent so page.tsx can accurately translate and speak it dynamically
            const textToSpeak = immediateInstruction.textEn; 
            if (textToSpeak !== lastSpokenRef.current) {
              onStepUpdate(textToSpeak);
              lastSpokenRef.current = textToSpeak;
            }
          }
        } else {
          setErrorMessage(lang === "ta" ? "வழித்தடம் கிடைக்கவில்லை" : "No path route coordinates found.");
        }
      } catch (err) {
        console.error("❌ Component Sync Failure:", err);
        if (isMounted) {
          setErrorMessage(lang === "ta" ? "இணைப்புப் பிழை ஏற்பட்டது" : "Server route sync failure.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    getRoute();

    return () => {
      isMounted = false;
    };
  }, [parametersKey, lang, onPathUpdate, onStepUpdate]); 

  const getIcon = (type: string) => {
    switch (type) {
      case "left": return <ArrowUpLeft className="text-blue-400" />;
      case "right": return <ArrowUpRight className="text-blue-400" />;
      case "end": return <CheckCircle2 className="text-emerald-500" />;
      default: return <ArrowUp className="text-slate-400" />;
    }
  };

  if (loading) return (
    <div className="flex items-center gap-2 p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
        {lang === "ta" ? "வழித்தடம் கணக்கிடப்படுகிறது..." : "Calculating Path..."}
      </span>
    </div>
  );

  if (errorMessage) return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
      <p className="text-xs text-red-400 font-semibold">{errorMessage}</p>
    </div>
  );

  return (
    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar pb-10">
      {steps.length === 0 && (
        <p className="text-slate-500 text-xs italic text-center p-4">
          {lang === "ta" ? "வழிமுறைகளைக் காண ஒரு QR குறியீட்டை ஸ்கேன் செய்யவும்" : "Scan a QR to see steps"}
        </p>
      )}
      {steps.map((step, i) => {
        const isCurrentActiveStep = i === 0;
        return (
          <div 
            key={i} 
            onClick={() => {
              // Trigger English base values on click so parent engine can map dictionary assets cleanly
              onStepUpdate(step.textEn);
            }}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 cursor-pointer ${
              isCurrentActiveStep 
                ? "bg-blue-600 shadow-lg shadow-blue-900/40 scale-[1.02]" 
                : "bg-white/5 opacity-40 hover:opacity-70"
            }`}
          >
            <div className={`p-2 rounded-xl ${isCurrentActiveStep ? "bg-white/20" : "bg-slate-800"}`}>
              {getIcon(step.type)}
            </div>
            <div>
              <p className={`text-sm font-bold ${isCurrentActiveStep ? "text-white" : "text-slate-300"}`}>
                {lang === "en" ? step.textEn : step.textTa}
              </p>
              {isCurrentActiveStep && (
                <p className="text-[9px] text-blue-100 uppercase font-black mt-0.5 opacity-80">
                  {lang === "ta" ? `வழிமுறை ${i + 1}` : `Instruction ${i + 1}`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
