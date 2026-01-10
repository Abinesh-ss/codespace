"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { QRCodeSVG } from "qrcode.react";
import { 
  Download, 
  Plus, 
  Copy, 
  MapPin, 
  Trash2, 
  Loader2, 
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export default function QRCodeGenerator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [mapId, setMapId] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* ================= AUTH + DATA FETCH ================= */
  useEffect(() => {
    const initPage = async () => {
      try {
        const authRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/my`, { 
          credentials: "include" 
        });
        if (!authRes.ok) { window.location.href = "/login"; return; }
        const authData = await authRes.json();
        setHospitalId(authData.id);

        const urlParams = new URLSearchParams(window.location.search);
        const mId = urlParams.get("mapId");
        setMapId(mId);

        if (mId) {
          const mapRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/map?mapId=${mId}`, {
            credentials: "include"
          });
          const mapData = await mapRes.json();
          
          // Map real POIs from your DB to the QR display format
          const pois = mapData?.graphData?.pointsOfInterest || [];
          const formatted = pois.map((poi: any) => ({
            id: poi.id,
            location: poi.name,
            type: poi.type,
            url: `${window.location.origin}/navigate/${authData.id}?mapId=${mId}&startId=${poi.id}`,
            created: new Date().toLocaleDateString()
          }));
          setQrCodes(formatted);
        }
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, []);

  /* ================= ACTIONS ================= */
  const downloadQR = (id: string, name: string) => {
    const svg = document.getElementById(`qr-${id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx?.drawImage(img, 0, 0, 1000, 1000);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${name.replace(/\s+/g, "-")}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <Layout showSidebar>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">QR FLEET</h1>
            <p className="text-gray-500 font-medium">Manage navigation touchpoints for this floor.</p>
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 text-indigo-600 font-bold text-sm">
            {qrCodes.length} Points Found
          </div>
        </header>

        {qrCodes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No POIs Synced</h3>
            <p className="text-gray-400 mt-1">Please save your map in the Editor first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qr) => (
              <div key={qr.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                {/* QR Section */}
                <div className="p-8 bg-gray-50 flex flex-col items-center justify-center border-b border-gray-100">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                    <QRCodeSVG
                      id={`qr-${qr.id}`}
                      value={qr.url}
                      size={180}
                      level="H" // High error correction
                    />
                  </div>
                  <span className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                    {qr.type}
                  </span>
                </div>

                {/* Info Section */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 truncate">{qr.location}</h3>
                    <p className="text-xs text-gray-400 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" /> Created: {qr.created}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadQR(qr.id, qr.location)}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"
                    >
                      <Download className="w-4 h-4" /> DOWNLOAD
                    </button>
                    <button
                      onClick={() => copyToClipboard(qr.url, qr.id)}
                      className={`p-3 rounded-xl border transition-all ${
                        copiedId === qr.id ? "bg-green-50 border-green-200 text-green-600" : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                      }`}
                    >
                      {copiedId === qr.id ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>

                  <button 
                    onClick={() => window.open(qr.url, '_blank')}
                    className="w-full py-2 text-[10px] font-bold text-indigo-500 flex items-center justify-center gap-1 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    PREVIEW NAV <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
