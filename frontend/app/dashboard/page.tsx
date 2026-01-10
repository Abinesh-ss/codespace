"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import { 
  Navigation, Map, CheckCircle, Clock, Upload, BarChart3, TrendingUp, Activity, ArrowRight, Loader2, PlusCircle, Building2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hospitalExists, setHospitalExists] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/my`, {
          credentials: "include",
        });

        // 1. Handle Unauthenticated (Redirect to Login)
        if (res.status === 401) { 
          window.location.href = "/login"; 
          return; 
        }

        // 2. Handle No Hospital Registered (Stay on Dashboard but show Welcome state)
        if (res.status === 404) { 
          setHospitalExists(false);
          setLoading(false);
          return; 
        }
        
        const result = await res.json();
        if (result && result.id) {
          setData(result);
          setHospitalExists(true);
        }
      } catch (err) {
        setError("Failed to sync real-time data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- LOADING STATE ---
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="text-gray-500 font-medium tracking-wide">Syncing live analytics...</p>
    </div>
  );

  // --- ERROR STATE ---
  if (error) return (
    <div className="h-screen flex items-center justify-center text-red-500 font-bold">
      {error}
    </div>
  );

  // --- WELCOME / EMPTY STATE (If no Hospital is registered) ---
  if (!hospitalExists) return (
    <Layout showSidebar>
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-indigo-50 p-6 rounded-3xl mb-6">
          <Building2 className="w-16 h-16 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
          WELCOME TO VAZHIKATTI
        </h1>
        <p className="text-gray-500 max-w-lg text-lg leading-relaxed mb-8">
          You haven't registered a hospital profile yet. Create your facility identity to start uploading maps and managing navigation.
        </p>
        <Link href="/register-hospital">
          <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center group">
            <PlusCircle className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
            REGISTER YOUR HOSPITAL
          </button>
        </Link>
      </div>
    </Layout>
  );

  // --- FULL DASHBOARD (Active Hospital) ---
  return (
    <Layout showSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {data?.name?.toUpperCase() || "DASHBOARD"}
            </h1>
            <p className="text-gray-500">Real-time navigation health and visitor metrics.</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/upload">
              <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center font-bold text-sm">
                <Upload className="w-4 h-4 mr-2" />
                UPLOAD NEW MAP
              </button>
            </Link>
          </div>
        </div>

        {/* Real Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Total Sessions" 
            value={data?.metrics?.totalSessions || 0} 
            icon={<Navigation />} 
            color="bg-indigo-500" 
          />
          <MetricCard 
            title="Active Maps" 
            value={data?.metrics?.activeMaps || 0} 
            icon={<Map />} 
            color="bg-green-500" 
          />
          <MetricCard 
            title="System Status" 
            value="Healthy" 
            icon={<CheckCircle />} 
            color="bg-blue-500" 
          />
          <MetricCard 
            title="Avg. Time" 
            value="2.4m" 
            icon={<Clock />} 
            color="bg-orange-500" 
          />
        </div>

        {/* Live Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-indigo-600" />
              VISITOR TRAFFIC (REAL-TIME)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.metrics?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-white p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6 uppercase tracking-widest text-xs">Recent Logs</h3>
            <div className="space-y-6">
              {data?.metrics?.recentActivity?.length > 0 ? (
                data.metrics.recentActivity.map((activity: any, i: number) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-800 leading-none">{activity.type}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(activity.time).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No activity recorded yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Footer Quick Action */}
        <Link href="/upload">
          <div className="cursor-pointer group bg-slate-900 rounded-3xl p-8 text-white flex justify-between items-center overflow-hidden relative">
             <div className="z-10">
                <h2 className="text-2xl font-black">Expand Your Reach</h2>
                <p className="text-slate-400 mt-1">Add a new floor plan to your navigation fleet today.</p>
             </div>
             <div className="z-10 bg-white text-black p-4 rounded-full group-hover:scale-110 transition-transform shadow-xl shadow-white/10">
                <Upload />
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          </div>
        </Link>
      </div>
    </Layout>
  );
}

function MetricCard({ title, value, icon, color }: any) {
  return (
    <Card className="bg-white p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
