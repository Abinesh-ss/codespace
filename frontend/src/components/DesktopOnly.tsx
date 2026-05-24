"use client";

import { MonitorSmartphone } from "lucide-react";

export default function DesktopOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile =
    typeof window !== "undefined" &&
    window.innerWidth < 1024;

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

          <p className="text-slate-600 leading-relaxed">
            Upload, editor, QR generation and dashboard
            features work best on larger screens.
          </p>

          <p className="text-slate-500 text-sm mt-4">
            Please open this page on a laptop or desktop
            monitor for the best experience.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
