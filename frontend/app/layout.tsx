import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Vazhikatti",
  description: "Indoor Navigation Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {/* 1. This displays your pages perfectly on desktop */}
        <main className="desktop-content">
          {children}
        </main>

        {/* 2. This displays your warning on mobile, hidden on desktop via CSS */}
        <div className="mobile-blocker-screen">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-lg p-8 text-center m-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Desktop Recommended
            </h1>
            <p className="text-gray-600 leading-relaxed mb-4">
              Upload, editor, QR generation, and dashboard features work best on larger screens.
            </p>
            <p className="text-gray-500 text-sm">
              Please open Vazhikatti on a laptop or desktop monitor for the best experience.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
