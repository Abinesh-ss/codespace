"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp, ArrowUpLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";

interface Props {
  startNodeId: string;
  endNodeId: string;
  floorId: string;
  hospitalId: string;
  lang?: "en" | "ta";
  onStepUpdate: (en: string, ta: string) => void;
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
  lang = "ta",
  onStepUpdate,
  onPathUpdate
}: Props) {
  const [steps, setSteps] = useState<{ textEn: string; textTa: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const lastSpokenRef = useRef("");

  useEffect(() => {
    if (!startNodeId || !endNodeId) return;

    async function getRoute() {
      setLoading(true);
      try {
        const res = await fetch("/api/navigation/shortest-path", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hospitalId, floorId, startNodeId, endNodeId })
        });

        const data = await res.json();
        
        if (data.path && data.path.length > 0) {
          // ✅ FIX: Ensure coordinates are numbers and logged for debugging
          const path = data.path.map((p: any) => ({ 
            x: parseFloat(p.x), 
            y: parseFloat(p.y) 
          }));

          console.log("📍 Path Calculated:", path);
          onPathUpdate(path);

          const generated = [];
          generated.push({ textEn: TXT.en.start, textTa: TXT.ta.start, type: "start" });

          // Turn logic
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

          const current = generated[0];
          if (current && current.textEn !== lastSpokenRef.current) {
            onStepUpdate(current.textEn, current.textTa);
            lastSpokenRef.current = current.textEn;
          }
        }
      } catch (err) {
        console.error("❌ Route Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    getRoute();
  }, [startNodeId, endNodeId, floorId, hospitalId]);

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
      <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Calculating Path...</span>
    </div>
  );

  return (
    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar pb-10">
      {steps.length === 0 && !loading && (
        <p className="text-slate-500 text-xs italic text-center p-4">Scan a QR to see steps</p>
      )}
      {steps.map((step, i) => (
        <div 
          key={i} 
          className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
            i === 0 ? "bg-blue-600 shadow-lg shadow-blue-900/40 scale-[1.02]" : "bg-white/5 opacity-40"
          }`}
        >
          <div className={`p-2 rounded-xl ${i === 0 ? "bg-white/20" : "bg-slate-800"}`}>
            {getIcon(step.type)}
          </div>
          <div>
            <p className={`text-sm font-bold ${i === 0 ? "text-white" : "text-slate-300"}`}>
              {lang === "en" ? step.textEn : step.textTa}
            </p>
            {i === 0 && (
              <p className="text-[9px] text-blue-100 uppercase font-black mt-0.5 opacity-80">
                Instruction {i + 1}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
