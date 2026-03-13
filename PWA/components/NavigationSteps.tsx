"use client";

import { useEffect, useState } from "react";
import { Navigation, MapPin, Loader2, AlertCircle } from "lucide-react";

interface Props {
  hospitalId: string;
  floorId?: string;
  startNodeId?: string;
  endNodeId?: string;
}

export default function NavigationSteps({
  hospitalId,
  floorId,
  startNodeId,
  endNodeId,
}: Props) {
  const [steps, setSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when inputs change
    setError(null);

    if (!hospitalId || !startNodeId || !endNodeId || !floorId) {
      setSteps([]);
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/navigation/shortest-path", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hospitalId,
            floorId,
            startNodeId,
            endNodeId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          // Specifically handle the 400 error we saw in logs
          if (res.status === 400) {
            setError("Outdated QR code or location. Please try scanning again.");
          } else {
            setError(data.error || "Failed to calculate route.");
          }
          setSteps([]);
          return;
        }

        setSteps(Array.isArray(data?.instructions) ? data.instructions : []);
      } catch (err) {
        console.error("Navigation error:", err);
        setError("Network error. Check your connection.");
        setSteps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [hospitalId, floorId, startNodeId, endNodeId]);

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-2 py-3">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <span className="text-sm text-slate-300">Calculating route…</span>
      </div>
    );
  }

  /* ---------- ERROR STATE ---------- */
  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <span className="text-sm text-red-200">{error}</span>
      </div>
    );
  }

  /* ---------- IDLE ---------- */
  if (!startNodeId || !endNodeId) {
    return (
      <div className="px-2 py-3 text-sm text-slate-400 italic">
        Awaiting navigation input...
      </div>
    );
  }

  /* ---------- NO PATH FOUND ---------- */
  if (steps.length === 0 && !loading) {
    return (
      <div className="px-2 py-3 text-sm text-slate-400">
        No available route found on this floor.
      </div>
    );
  }

  /* ---------- ACTIVE NAVIGATION ---------- */
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar py-1">
      {steps.map((text, i) => {
        const isLast = i === steps.length - 1;

        return (
          <div
            key={i}
            className="
              snap-center shrink-0 w-[85%]
              bg-slate-900/70 backdrop-blur-md
              border border-white/10
              rounded-2xl
              px-4 py-4
              flex gap-4
              shadow-xl
            "
          >
            <div className="flex flex-col items-center gap-1 pt-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center
                  ${
                    isLast
                      ? "bg-green-500/20 text-green-400"
                      : "bg-blue-500/20 text-blue-400"
                  }
                `}
              >
                {isLast ? <MapPin size={20} /> : <Navigation size={20} />}
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                {isLast ? "Goal" : `Step ${i + 1}`}
              </span>
            </div>

            <p className="text-[15px] text-white font-medium leading-relaxed self-center">
              {text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
