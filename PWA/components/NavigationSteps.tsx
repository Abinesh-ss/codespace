"use client";

import { useEffect, useState } from "react";
import { Navigation, MapPin, Loader2 } from "lucide-react";

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

  // ✅ SAFE: inside component
  console.log("NAV PAYLOAD:", {
    hospitalId,
    floorId,
    startNodeId,
    endNodeId,
  });

  useEffect(() => {
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
        setSteps(
          Array.isArray(data?.instructions) ? data.instructions : []
        );
      } catch (err) {
        console.error("Navigation error:", err);
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
        <span className="text-sm text-slate-300">
          Calculating route…
        </span>
      </div>
    );
  }

  /* ---------- IDLE ---------- */
  if (!startNodeId || !endNodeId) {
    return (
      <div className="px-2 py-3 text-sm text-slate-400">
        Awaiting navigation input
      </div>
    );
  }

  /* ---------- NO PATH ---------- */
  if (steps.length === 0) {
    return (
      <div className="px-2 py-3 text-sm text-slate-400">
        No available route on this floor
      </div>
    );
  }

  /* ---------- ACTIVE ---------- */
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar py-1">
      {steps.map((text, i) => {
        const isLast = i === steps.length - 1;

        return (
          <div
            key={i}
            className="
              snap-center shrink-0 w-[80%]
              bg-slate-900/70 backdrop-blur
              border border-white/5
              rounded-2xl
              px-4 py-3
              flex gap-4
            "
          >
            <div className="flex flex-col items-center gap-1 pt-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center
                  ${
                    isLast
                      ? "bg-green-500/15 text-green-400"
                      : "bg-blue-500/15 text-blue-400"
                  }
                `}
              >
                {isLast ? (
                  <MapPin size={18} />
                ) : (
                  <Navigation size={18} />
                )}
              </div>
              <span className="text-[9px] text-slate-500 font-semibold">
                {isLast ? "END" : `STEP ${i + 1}`}
              </span>
            </div>

            <p className="text-sm text-white font-medium leading-snug">
              {text}
            </p>
          </div>
        );
      })}
    </div>
  );
}

