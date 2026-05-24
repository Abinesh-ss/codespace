"use client";

import { useState, useEffect, type ReactNode } from "react";
import { MonitorSmartphone } from "lucide-react";

export default function MobileBlocker({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Run on initial load
    checkScreenSize();

    // Catch screen size updates or device rotations
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <MonitorSmartphone className="w-7 h-7 text-indigo-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Desktop Recommended
          </h1>

          <p className="text-slate-600 leading-relaxed mb-4">
            Upload, editor, QR generation, and dashboard features work best on larger screens.
          </p>

          <p className="text-slate-500 text-sm">
            Please open Vazhikatti on a laptop or desktop monitor for the best experience.
          </p>
        </div>
      </div>
    );
  }

  // If on desktop, render the pages normally
  return <>{children}</>;
}
