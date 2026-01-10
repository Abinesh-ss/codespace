"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { LogOut, LayoutDashboard, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SidebarLayout({
  children,
  auth,
}: {
  children: ReactNode;
  auth: boolean;
}) {
  const router = useRouter();

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {auth && (
        <aside className="w-64 bg-white border-r hidden md:block">
          <div className="p-6 font-bold text-xl">HospiNav Pro</div>
          <nav className="px-4 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
            >
              <Upload className="w-4 h-4" /> Upload
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded w-full"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </nav>
        </aside>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
}

