"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  Shield,
  LogOut,
  Menu,
  X,
  BarChart3,
  Upload,
  Map,
  Navigation,
  QrCode,
} from "lucide-react";

export default function Layout({
  children,
  showSidebar = true,
}: {
  children: ReactNode;
  showSidebar?: boolean;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    router.push("/login");
  };

  /* ---------------- NAVBAR ---------------- */
  const AuthNav = () => (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Navigation className="w-8 h-8 text-indigo-600" />
          <span className="text-lg font-semibold text-gray-900">
            Vazhikatti
          </span>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/upload">Upload</NavLink>
          <NavLink href="/editor">Editor</NavLink>
          <NavLink href="/navigate">Navigate</NavLink>
          <NavLink href="/qr-generator">QR</NavLink>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center text-sm text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </button>

          {/* MOBILE MENU BUTTON ONLY */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="p-4 space-y-2">
            <MobileLink href="/dashboard">Dashboard</MobileLink>
            <MobileLink href="/upload">Upload</MobileLink>
            <MobileLink href="/editor">Editor</MobileLink>
            <MobileLink href="/navigate">Navigate</MobileLink>
            <MobileLink href="/qr">QR</MobileLink>

            <button
              onClick={handleLogout}
              className="w-full text-left py-2 text-red-600"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthNav />
      <main className="p-6">{children}</main>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block py-2 text-gray-700 hover:text-indigo-600"
    >
      {children}
    </Link>
  );
}

