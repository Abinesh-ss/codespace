"use client"; // This fixes the 'useContext' must be used in a client component error

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Ensure the component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          Vazhikatti Backend
        </h1>
        <p className="text-gray-600 text-lg">
          Deployment Status: <span className="text-green-500 font-mono">Active</span>
        </p>
      </header>

      <main className="grid gap-6 max-w-2xl w-full">
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h2 className="font-semibold text-xl mb-2">Prisma Generation</h2>
          <p className="text-sm text-gray-500">
            Database client generated successfully via postinstall.
          </p>
        </div>

        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h2 className="font-semibold text-xl mb-2">Next.js App Router</h2>
          <p className="text-sm text-gray-500">
            Layout and Page structure optimized for Render production builds.
          </p>
        </div>
      </main>

      <footer className="mt-12 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Vazhikatti SaaS
      </footer>
    </div>
  );
}
