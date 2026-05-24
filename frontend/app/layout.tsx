import type { ReactNode } from "react";
import "./globals.css";

// 1. Keep layout as a Server Component so metadata works smoothly
export const metadata = {
  title: "Vazhikatti",
  description: "Indoor Navigation Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {/* We call the client blocker here */}
        <MobileClientWrapper>{children}</MobileClientWrapper>
      </body>
    </html>
  );
}

// 2. We import our client hook layout dynamically right inside the same file
import { useState, useEffect } from "react";
import { MonitorSmartphone } from "lucide-react";

function MobileClientWrapper({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();

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

  return <>{children}</>;
}
