"use client";

import { useState, useEffect, type ReactNode } from "react";
import { MonitorSmartphone } from "lucide-react";
import "./globals.css";

// Note: If Next.js throws an error about metadata in a client component,
// you can move the metadata object to a separate 'layout.server.tsx' file,
// or simply keep it here if your framework configuration allows it.
// For Next.js App Router, metadata must technically be in a Server Component. 
// Let's write this safely so it works perfectly:

export default function RootLayout({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check screen width on mount
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();

    // Listen for resize changes (or phone rotations)
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {isMobile ? (
          /* Mobile Block Screen UI */
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
        ) : (
          /* Render your actual website pages if on desktop */
          children
        )}
      </body>
    </html>
  );
}import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Vazhikatti",
  description: "Indoor Navigation Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}

