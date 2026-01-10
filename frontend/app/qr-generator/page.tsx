"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, Loader2, MapPin, BarChart3 } from "lucide-react";

function QRManager() {
  const searchParams = useSearchParams();
  const hospitalId = searchParams.get("hospitalId");
  const mapId = searchParams.get("mapId");

  const [pois, setPois] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFloorData = async () => {
      if (!hospitalId || !mapId) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/floor?hospitalId=${hospitalId}`, {
          credentials: "include"
        });
        const data = await res.json();
        const currentFloor = data.find((f: any) => f.id === mapId);
        if (currentFloor?.graphData?.pointsOfInterest) {
          setPois(currentFloor.graphData.pointsOfInterest);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFloorData();
  }, [hospitalId, mapId]);

  const downloadPNG = (poiName: string, poiId: string) => {
    const svg = document.getElementById(`qr-${poiId}`) as SVGElement | null;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${poiName.replace(/\s+/g, "-")}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-indigo-600" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {pois.map((poi) => {
        // Points to the ANALYTICS route instead of directly to the map
        const analyticsUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scan/${poi.id}?hospitalId=${hospitalId}&mapId=${mapId}`;

        return (
          <div key={poi.id} className="bg-white border-2 border-gray-100 rounded-[32px] p-6 flex flex-col items-center shadow-sm hover:shadow-md transition-all break-inside-avoid group">
            <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
              <QRCodeSVG 
                id={`qr-${poi.id}`}
                value={analyticsUrl}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
                <MapPin size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">{poi.type}</span>
              </div>
              <h3 className="text-lg font-black text-gray-900">{poi.name}</h3>
            </div>

            <div className="flex gap-2 w-full no-print">
              <button 
                onClick={() => downloadPNG(poi.name, poi.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                <Download size={14} /> PNG
              </button>
              <button 
                onClick={() => window.location.href = `/dashboard/analytics?poiId=${poi.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all"
              >
                <BarChart3 size={14} /> STATS
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FullQRGeneratorPage() {
  return (
    <Layout showSidebar>
      <div className="p-8 max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-10 no-print">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Smart QR Console</h1>
            <p className="text-gray-500 font-medium">Trackable, downloadable, and printable navigation points.</p>
          </div>
          <button onClick={() => window.print()} className="bg-black text-white px-8 py-3 rounded-2xl font-black text-sm tracking-widest hover:scale-105 transition-all shadow-xl">
            PRINT ALL CODES
          </button>
        </header>

        <Suspense fallback={<Loader2 className="animate-spin mx-auto" />}>
          <QRManager />
        </Suspense>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .sidebar { display: none !important; }
          .grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 30px !important; }
          body { padding: 0; margin: 0; }
        }
      `}</style>
    </Layout>
  );
}
