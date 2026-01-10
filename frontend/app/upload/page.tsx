"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase"; // Ensure you've created this file
import { 
  Upload as UploadIcon, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  X,
  Zap,
  Loader2
} from "lucide-react";

/* ---------- TYPES ---------- */
interface UploadFile {
  id: number;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "completed" | "error";
  progress: number;
  dbId?: string;
  rawFile: File; // Added to store the actual file for Supabase
}

export default function Upload() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  /* ---------- AUTH CHECK ---------- */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/my`, {
          credentials: "include"
        });
        if (res.status === 401) { window.location.href = "/login"; return; }
        
        const data = await res.json();
        if (!data?.id) { window.location.href = "/login"; return; }
        
        setHospitalId(data.id);
        setIsAuthenticated(true);
      } catch (err) {
        window.location.href = "/login";
      }
    };
    checkAuth();
  }, []);

  /* ---------- UPLOAD & PERSISTENCE LOGIC ---------- */

  const startProcess = async (fileInfo: UploadFile) => {
    try {
      const file = fileInfo.rawFile;
      const fileExt = file.name.split('.').pop();
      const fileName = `${hospitalId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `maps/${hospitalId}/${fileName}`;

      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hospital-maps') // Your bucket name
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hospital-maps')
        .getPublicUrl(filePath);

      // 3. Save to PostgreSQL Database via your API
      const dbId = await saveToDatabase(fileInfo, publicUrl);

      if (!dbId) throw new Error("Database sync failed");

      // Update UI to success
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id ? { ...f, status: "completed", progress: 100, dbId } : f
      ));

    } catch (err) {
      console.error("Upload process failed:", err);
      setFiles(prev => prev.map(f => f.id === fileInfo.id ? { ...f, status: "error" } : f));
    }
  };

  const saveToDatabase = async (file: UploadFile, realUrl: string) => {
    try {
      // Create the Map entry
      const mapRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          imageUrl: realUrl,
        }),
      });

      if (!mapRes.ok) throw new Error("Map DB Save failed");
      const mapData = await mapRes.json();
      const mapId = mapData.mapId || mapData.id;

      // TRIGGER AUTO-POI IDENTIFICATION
      // FIX: credentials: "include" added here to prevent 401
      const poiRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/poi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({
          action: "IDENTIFY_AUTO",
          mapId: mapId,
          graphData: { nodes: [] } // Pass actual nodes if available
        }),
      });

      localStorage.setItem("uploadedMapUrl", realUrl);
      return mapId;
    } catch (err) {
      console.error("Persistence error:", err);
      return null;
    }
  };

  /* ---------- UI HANDLERS ---------- */

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 50, // Initial UI progress
      rawFile: file
    }));

    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => startProcess(file));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0) handleFiles(e.dataTransfer.files);
  };

  if (isAuthenticated === null) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
    </div>
  );

  return (
    <Layout showSidebar>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">MAP UPLOAD</h1>
            <p className="text-gray-500">Upload floor plans to power your smart navigation.</p>
          </div>
          <div className="text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-2 font-bold uppercase tracking-tighter">
            <Zap className="w-4 h-4" /> AI Ready
          </div>
        </header>

        {/* DROPZONE */}
        <div
          className={`border-4 border-dashed rounded-[32px] p-16 text-center transition-all cursor-pointer ${
            dragActive ? "border-indigo-500 bg-indigo-50 scale-[0.99]" : "border-gray-200 bg-white hover:border-gray-300"
          }`}
          onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-xl shadow-indigo-200">
            <UploadIcon className="w-10 h-10 text-white" />
          </div>
          <input type="file" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" id="file-upload" accept="image/*" />
          <h3 className="text-2xl font-black text-gray-900">Drop your floor plans</h3>
          <p className="mt-2 text-gray-500 font-medium">Supports PNG, JPG (High Resolution Recommended)</p>
        </div>

        {/* QUEUE */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-black text-gray-900 text-sm uppercase tracking-widest">Upload Status</h2>
            <div className="grid gap-4">
              {files.map(file => (
                <div key={file.id} className="group relative flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[24px] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-5 flex-1">
                    <div className={`p-4 rounded-2xl ${file.status === 'error' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                      <ImageIcon size={28} />
                    </div>
                    <div className="flex-1 max-w-md">
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-gray-900 truncate">{file.name}</span>
                        <span className="text-[10px] font-black text-indigo-600">{file.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${file.status === 'error' ? 'bg-red-500' : 'bg-indigo-600'}`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-6">
                    {file.status === "completed" && (
                      <button 
                        onClick={() => window.location.href = `/editor?mapId=${file.dbId}`}
                        className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-black transition-all uppercase tracking-widest"
                      >
                        Launch Editor
                      </button>
                    )}
                    {file.status === "uploading" ? (
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    ) : file.status === "completed" ? (
                      <CheckCircle className="w-7 h-7 text-green-500" />
                    ) : (
                      <AlertCircle className="w-7 h-7 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
