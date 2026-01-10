"use client";
import { useEffect, useState } from "react";
import { ChevronRight, Navigation, MapPin, Loader2, Info } from "lucide-react";

export default function NavigationSteps({ startNodeId, endNodeId, floorId }: any) {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startNodeId || !endNodeId || !floorId) {
      setSteps([]);
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/navigation/shortest-path`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ floorId, startNodeId, endNodeId })
        });
        const data = await res.json();
        setSteps(data.instructions || []);
      } catch (e) {
        console.error("Pathfinding error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [startNodeId, endNodeId, floorId]);

  // LOADING STATE: Industrial Spinner
  if (loading) return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Calculating Path...</p>
    </div>
  );

  return (
    <div className="w-full">
      {steps.length > 0 ? (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 no-scrollbar">
          {steps.map((s, i) => (
            <div 
              key={i} 
              className="snap-center shrink-0 w-[85%] first:ml-0 last:mr-0 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 p-5 rounded-2xl shadow-xl flex items-start gap-4"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                   <Navigation size={20} className={i === steps.length - 1 ? "hidden" : "block"} />
                   <MapPin size={20} className={i === steps.length - 1 ? "block" : "hidden"} />
                </div>
                <span className="text-[10px] font-black text-slate-500">STEP {i + 1}</span>
              </div>
              
              <div className="flex-1">
                <p className="text-white font-semibold text-base leading-tight mb-1">{s}</p>
                <div className="flex items-center gap-1">
                   <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Proceed carefully</span>
                   <ChevronRight size={12} className="text-blue-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* EMPTY STATE: Professional Guide */
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-full text-blue-400">
            <Info size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Ready to Navigate?</h4>
            <p className="text-slate-400 text-xs mt-1">
              {!startNodeId ? "Scan the nearest QR code to verify your position." : "Search for a department to get turn-by-turn directions."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
