"use client";

import { useEffect, useRef, useMemo } from "react";

interface Props {
  rotation: number; // The phone's current compass heading (0-360)
  userPos: { x: number; y: number } | null;
  path: { x: number; y: number }[];
}

export default function ARAnchorScanner({ rotation, userPos, path }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Determine the target node (the next point on the path)
  const targetNode = useMemo(() => {
    if (!userPos || path.length < 2) return null;

    // Find the point on the path the user is currently closest to
    let closestIndex = 0;
    let minDist = Infinity;
    path.forEach((p, i) => {
      const dist = Math.hypot(p.x - userPos.x, p.y - userPos.y);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    });

    // Target the NEXT point after the closest one to lead the user forward
    return path[closestIndex + 1] || path[closestIndex];
  }, [userPos, path]);

  // 2. Calculate the "Relative Bearing"
  // This is the magic: (Angle to Target) - (Current Phone Facing)
  const arrowRotation = useMemo(() => {
    if (!userPos || !targetNode) return 0;

    // Calculate angle in degrees from user to target
    // In SVG/Canvas: atan2(dy, dx)
    const angleRad = Math.atan2(targetNode.y - userPos.y, targetNode.x - userPos.x);
    const angleDeg = angleRad * (180 / Math.PI);

    /**
     * Subtract the phone's rotation. 
     * If the target is at 90° (East) and your phone is facing 90° (East), 
     * the arrow should point 0° (Straight ahead on screen).
     */
    return angleDeg - rotation;
  }, [userPos, targetNode, rotation]);

  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("AR Camera Error:", err);
      }
    };
    startCamera();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* CAMERA FEED */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        muted
        playsInline
      />

      {/* 🔥 DYNAMIC AR ARROW */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          style={{
            transform: `rotate(${arrowRotation}deg)`,
            transition: "transform 0.1s ease-out"
          }}
          className="w-32 h-32 flex items-center justify-center"
        >
          {/* Arrow SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-lg">
            <defs>
              <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            {/* The arrow points UP (0 degrees) by default in SVG */}
            <path
              d="M50 5 L90 85 L50 70 L10 85 Z"
              fill="url(#arrowGradient)"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* HUD INFO */}
      <div className="absolute top-10 left-0 w-full flex justify-center px-6">
        <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-center">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Navigation Active</p>
          <p className="text-white text-lg font-medium">
            {targetNode ? "Follow the arrow" : "Scanning for location..."}
          </p>
        </div>
      </div>

      {/* DISTANCE / PROGRESS */}
      <div className="absolute bottom-10 w-full px-10">
         <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${(path.indexOf(targetNode!) / path.length) * 100}%` }}
            />
         </div>
      </div>
    </div>
  );
}
