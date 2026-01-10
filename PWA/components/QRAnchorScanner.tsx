"use client";

import { useEffect, useRef } from "react";
import jsQR from "jsqr";

interface Props {
  onDetect: (data: any) => void;
}

export default function QRAnchorScanner({ onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

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

            try {
              const parsedData = JSON.parse(code.data);
              onDetect(parsedData);
            } catch {
              onDetect({ id: code.data });
            }

            // 🔹 Stop camera immediately after detection
            if (activeStream) {
              activeStream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);

            // 🔹 Reset last scanned after 3 seconds to allow rescanning
            setTimeout(() => (lastScannedRef.current = null), 3000);
            return; // exit scan loop
          }
        }
      }
      animationFrameIdRef.current = requestAnimationFrame(scan);
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        activeStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          scan();
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    startCamera();

    return () => {
      if (activeStream) activeStream.getTracks().forEach(track => track.stop());
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [onDetect]);

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800">
      <video ref={videoRef} className="w-full h-full object-cover" muted />
      
      {/* Visual scanning overlay */}
      <div className="absolute inset-0 border-[3px] border-blue-500/30 m-12 rounded-xl pointer-events-none">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
        
        {/* Animated scanning line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-500/50 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    </div>
  );
}

