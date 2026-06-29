"use client";
import { useEffect, useRef } from "react";

// Changed "export default" to "export const" to match your named imports
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
