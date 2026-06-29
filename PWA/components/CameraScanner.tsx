"use client";
import { useEffect, useRef } from "react";

// Using a named export explicitly
export const CameraScanner = () => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        if (ref.current) {
          ref.current.srcObject = stream;
          ref.current.play();
        }
      });
  }, []);

  return <video ref={ref} style={{ width: "100%" }} />;
};
