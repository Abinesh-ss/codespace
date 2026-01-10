"use client";
import { useEffect, useRef } from "react";

export default function CameraScanner() {
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
}