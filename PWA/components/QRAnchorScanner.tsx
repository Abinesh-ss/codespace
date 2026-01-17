"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

interface Props {
  onDetect: (data: any) => void;
}

export default function QRAnchorScanner({ onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true; // Prevents state updates on unmounted component

    const scan = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data !== lastScannedRef.current) {
            lastScannedRef.current = code.data;
            let parsedData: any;
            try {
              parsedData = JSON.parse(code.data);
            } catch {
              try {
                const url = new URL(code.data);
                parsedData = {
                  url: code.data,
                  scanId: url.pathname.split("/").pop(),
                };
              } catch {
                parsedData = { data: code.data };
              }
            }
            onDetect(parsedData);
            return; // Stop scanning once detected
          }
        }
      }
      if (isMounted) {
        animationFrameIdRef.current = requestAnimationFrame(scan);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        activeStream = stream;
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          // Catch play() to prevent "AbortError" in rapid UI toggles
          await videoRef.current.play().catch(() => {}); 
          scan();
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Camera access denied:", err);
          setCameraError("Camera access denied. Use HTTPS and check permissions.");
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (activeStream) activeStream.getTracks().forEach(track => track.stop());
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [onDetect, retryKey]);

  return (
    <div className="relative w-full h-full bg-black">
      {cameraError ? (
        <div className="p-4 text-red-500 text-center flex flex-col items-center justify-center h-full gap-4">
          <span>{cameraError}</span>
          <button onClick={() => setRetryKey(k => k + 1)} className="bg-blue-600 px-4 py-2 rounded text-white">Retry</button>
        </div>
      ) : (
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      )}
    </div>
  );
}
