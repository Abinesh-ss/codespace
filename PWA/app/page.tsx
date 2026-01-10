"use client";
import { useRouter } from "next/navigation";
import { MapPin, ScanLine, ShieldCheck, ChevronRight } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* 1. TOP HERO SECTION: Using a rounded-bottom container for visual depth */}
      <section className="w-full bg-blue-700 pt-16 pb-24 px-6 rounded-b-[48px] shadow-2xl text-center">
        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-lg border border-white/30">
          <MapPin size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          HospiNav <span className="font-light opacity-80">Pro</span>
        </h1>
        <p className="text-blue-100 text-sm max-w-[280px] mx-auto leading-relaxed">
          Navigate the medical center with ease using our live AR-positioning system.
        </p>
      </section>

      {/* 2. FLOATING ACTION CARD: Positioned halfway between sections */}
      <div className="w-full max-w-md px-6 -mt-12">
        <button 
          onClick={() => router.push("/navigate")}
          className="w-full bg-white p-6 rounded-3xl shadow-xl flex items-center gap-5 hover:bg-slate-50 active:scale-[0.98] transition-all border border-slate-100"
        >
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200">
            <ScanLine size={28} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-slate-900 font-bold text-lg leading-tight">Start Navigation</h3>
            <p className="text-slate-500 text-sm font-medium">Scan a QR code near you</p>
          </div>
          <ChevronRight className="ml-auto text-slate-300" size={24} />
        </button>
      </div>

      {/* 3. "HOW TO USE" SECTION: Using a vertical step-indicator layout */}
      <section className="w-full max-w-md p-8 mt-6">
        <div className="flex justify-between items-end mb-8">
          <h4 className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em]">How to use</h4>
          <div className="h-px bg-slate-200 flex-1 ml-4 mb-1.5 opacity-50"></div>
        </div>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs flex items-center justify-center font-bold border border-blue-100 ring-4 ring-white">1</div>
              <div className="w-px h-full bg-slate-200 my-2"></div>
            </div>
            <div className="pb-2">
              <p className="text-slate-800 font-bold text-sm mb-1">Find a Navigator QR</p>
              <p className="text-slate-500 text-xs leading-relaxed">Located at every entrance, hallway intersection, and elevator.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs flex items-center justify-center font-bold border border-blue-100 ring-4 ring-white">2</div>
              <div className="w-px h-full bg-slate-200 my-2"></div>
            </div>
            <div className="pb-2">
              <p className="text-slate-800 font-bold text-sm mb-1">Allow Camera Access</p>
              <p className="text-slate-500 text-xs leading-relaxed">We use the camera only to detect your live indoor position via stickers.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs flex items-center justify-center font-bold border border-blue-100 ring-4 ring-white">3</div>
            </div>
            <div>
              <p className="text-slate-800 font-bold text-sm mb-1">Follow the Blue Line</p>
              <p className="text-slate-500 text-xs leading-relaxed">Real-time arrows and paths will guide you to your room or department.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER: Using a subtle layout for trust markers */}
      <footer className="mt-auto p-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-slate-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold tracking-widest uppercase">Encrypted Connection</span>
        </div>
        <p className="text-[10px] text-slate-300 font-medium">© 2026 HospiNav Pro v2.4</p>
      </footer>
    </main>
  );
}
