"use client";

export default function MapOverlay({
  floor,
  x,
  y,
}: {
  floor: string;
  x: number;
  y: number;
}) {
  return (
    <div className="w-full h-full relative bg-[#020617]">

      {/* GRID */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148,163,184,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148,163,184,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* USER DOT */}
      <div
        className="absolute z-10"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-3 h-3 rounded-full bg-blue-500" />
      </div>

      {/* FLOOR LABEL */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2
                      px-3 py-1 rounded-md
                      bg-slate-900/80
                      border border-white/10
                      text-xs text-slate-300">
        Floor {floor}
      </div>
    </div>
  );
}

