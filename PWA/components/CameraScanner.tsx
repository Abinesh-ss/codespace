"use client";
import { useEffect, useRef } from "react";

// 1. Define the props interface to accept onScan
interface CameraScannerProps {
  onScan: (scannedText: string) => void | Promise<void>;
}

// 2. Destructure onScan from the component arguments
export const CameraScanner: React.FC<CameraScannerProps> = ({ onScan }) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        if (ref.current) {
          ref.current.srcObject = stream;
          ref.current.play();
        }
      });
      
    // Note: If you have QR scanning library logic (like html5-qrcode or jsqr) 
    // that processes the video stream, it should call onScan(detectedText) here.
  }, [onScan]);

  return <video ref={ref} style={{ width: "100%" }} />;
};
