"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import jsQR from "jsqr";

import {
  CameraOff,
  RefreshCw,
} from "lucide-react";

interface Props {
  onDetect: (data: string) => void;
}

/* -------------------------------- */
/* CONFIG                           */
/* -------------------------------- */

const SCAN_INTERVAL = 150;
const DUPLICATE_TIMEOUT = 3000;

export default function QRAnchorScanner({ onDetect }: Props) {
  /* -------------------------------- */
  /* REFS                             */
  /* -------------------------------- */

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const scanningRef = useRef(false);

  /* -------------------------------- */
  /* STATE                            */
  /* -------------------------------- */

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  /* -------------------------------- */
  /* HARDWARE STREAM RESOURCE CLEANUP */
  /* -------------------------------- */

  const cleanup = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        if (track.readyState === "live") {
          track.stop();
        }
      });
      streamRef.current = null;
    }

    scanningRef.current = false;
  };

  /* -------------------------------- */
  /* FRAME ANALYSIS LOOP              */
  /* -------------------------------- */

  const scanFrame = () => {
    if (
      !mountedRef.current ||
      !videoRef.current ||
      !canvasRef.current ||
      !scanningRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Wait until the camera element is fully initialized with valid video stream frames
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      scheduleNextScan();
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      scheduleNextScan();
      return;
    }

    // Dynamic resolution scaling to prevent performance drops on mobile chips
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code?.data && code.data.trim() !== "") {
        if (code.data !== lastScanRef.current) {
          lastScanRef.current = code.data;

          // Immediate feedback execution callback
          onDetect(code.data);

          setTimeout(() => {
            lastScanRef.current = null;
          }, DUPLICATE_TIMEOUT);
        }
      }
    } catch (err) {
      console.error("Frame read error:", err);
    }

    scheduleNextScan();
  };

  const scheduleNextScan = () => {
    if (!mountedRef.current || !scanningRef.current) return;
    scanTimeoutRef.current = setTimeout(scanFrame, SCAN_INTERVAL);
  };

  /* -------------------------------- */
  /* HARDWARE WAKEUP ROUTINE          */
  /* -------------------------------- */

  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      cleanup(); // Reclaim lingering hardware processes

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for programmatic play acknowledgment before changing UI states
        await videoRef.current.play();

        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }

        scanningRef.current = true;
        setError(null); // Explicit clear step to completely fix initialization flash errors
        setLoading(false);
        scanFrame();
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      if (mountedRef.current) {
        setLoading(false);
        setError("Camera permission denied or video device unavailable.");
      }
    }
  };

  /* -------------------------------- */
  /* STATE BOUNDARY LIFECYCLE         */
  /* -------------------------------- */

  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [retryKey]);

  /* -------------------------------- */
  /* UI RENDERING HOOD                */
  /* -------------------------------- */

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
      
      {/* NATIVE HARDWARE MEDIA LAYER */}
      {!error && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          muted
          playsInline
          autoPlay
        />
      )}

      {/* LOADING SPINNER STATE */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            Connecting Video Stream...
          </p>
        </div>
      )}

      {/* ERROR INTERACTION DRAWER */}
      {error && (
        <div className="z-30 text-center p-6 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/5 max-w-xs mx-4">
          <CameraOff className="mx-auto text-red-400 mb-4" size={44} />
          <p className="text-sm font-semibold text-slate-200 mb-2">Camera Access Blocked</p>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">{error}</p>

          <button
            onClick={() => setRetryKey((v) => v + 1)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide active:scale-[0.98] transition-transform shadow-lg"
          >
            <RefreshCw size={14} />
            Retry Connection
          </button>
        </div>
      )}

      {/* DIGITAL SCAN TARGET HUD OVERLAY */}
      {!error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-black/20">
          
          {/* CAMERA VIEWFINDER SCAN TARGET BOX */}
          <div className="relative w-64 h-64 rounded-[2rem] border border-white/10 overflow-hidden shadow-[0_0_0_400px_rgba(2,6,23,0.65)]">
            
            {/* CORNER GUIDES */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-500 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-500 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-500 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-500 rounded-br-xl" />

            {/* SMOOTH ANIMATED SCAN LINE */}
            <div className="scanner-line absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.85)]" />
          </div>

          {/* SYSTEM DESCRIPTION BOTTOM BAR */}
          <div className="mt-8 px-5 py-2.5 rounded-full border border-white/5 bg-slate-900/80 backdrop-blur-md shadow-xl">
            <p className="text-[11px] uppercase tracking-wider font-black text-slate-300">
              Align QR Code Within Target Corner Anchors
            </p>
          </div>
        </div>
      )}

      {/* INLINE SPECIFIC ANIMATION LAYER */}
      <style jsx global>{`
        @keyframes scanMotion {
          0% {
            top: 0%;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0%;
          }
        }
        .scanner-line {
          animation: scanMotion 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
