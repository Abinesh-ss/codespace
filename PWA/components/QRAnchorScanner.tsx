"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { CameraOff, RefreshCw } from "lucide-react";

interface Props {
  onDetect: (data: string) => void;
}

export default function QRAnchorScanner({ onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScanRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Use a ref to track if we should stop scanning (to prevent background processing)
  const isScanningRef = useRef(true);

  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  /* ---------------- SCAN LOOP ---------------- */
  const scan = () => {
    if (!isScanningRef.current) return; // STOP the loop if triggered elsewhere

    const video = videoRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height);

        if (code?.data) {
          if (code.data !== lastScanRef.current) {
            console.log("✅ QR DETECTED:", code.data);

            lastScanRef.current = code.data;
            
            // Immediately signal to stop the loop before notifying the parent
            isScanningRef.current = false; 
            onDetect(code.data);

            /* cooldown to allow future scans if parent doesn't unmount */
            setTimeout(() => {
              lastScanRef.current = null;
              isScanningRef.current = true;
            }, 3000);
          }
        }
      }
    }

    if (isScanningRef.current) {
      rafRef.current = requestAnimationFrame(scan);
    }
  };

  /* ---------------- CAMERA ---------------- */
  useEffect(() => {
    let mounted = true;
    isScanningRef.current = true;

    const start = async () => {
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
          // Use then/catch for play() to handle browsers that block auto-play
          videoRef.current.play().then(() => {
            scan();
          }).catch(e => console.error("Video play failed:", e));
        }
      } catch (err) {
        console.error(err);
        setError("Camera permission denied or not found");
      }
    };

    start();

    return () => {
      mounted = false;
      isScanningRef.current = false; // Kill the scan loop
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [retryKey]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {error ? (
        <div className="text-center p-6">
          <CameraOff className="text-red-500 mx-auto mb-4" size={48} />
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => setRetryKey((k) => k + 1)}
            className="bg-blue-600 px-6 py-3 rounded-xl flex items-center gap-2 mx-auto active:scale-95 transition-transform"
          >
            <RefreshCw size={18} /> Retry Camera
          </button>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover" 
            muted 
            playsInline 
          />

          {/* Scanner UI Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
              
              {/* Scanning Bar Animation */}
              <div className="w-full h-1 bg-blue-500/50 absolute top-0 animate-[scan_2s_linear_infinite]" 
                   style={{ boxShadow: '0 0 15px 2px rgba(59,130,246,0.8)' }} />
            </div>

            <p className="mt-12 text-sm font-medium text-white bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
              Align QR code within frame
            </p>
          </div>
        </>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
