import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL!;

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: NextRequest) {
  try {
    // 1. Existing Logic: Token Validation
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return cors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return cors(NextResponse.json({ error: "Invalid token" }, { status: 401 }));
    }

    // 2. Updated Logic: Fetch Hospital with related analytics
    // We use Prisma's '_count' to get totals efficiently
    const hospital = await prisma.hospital.findFirst({
      where: { createdByUser: payload.userId },
      include: {
        _count: {
          select: { 
            maps: true, 
            floors: true, 
            analyticsEvents: true 
          }
        },
        // Fetch last 5 activity events
        analyticsEvents: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!hospital) {
      return cors(NextResponse.json({ error: "No hospital found" }, { status: 404 }));
    }

    // 3. Logic: Aggregating Chart Data (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await prisma.analyticsEvent.groupBy({
      by: ['createdAt'],
      where: {
        hospitalId: hospital.id,
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true }
    });

    // Format the chart data for Recharts (Frontend)
    const chartData = stats.map(s => ({
      day: new Date(s.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
      sessions: s._count.id
    }));

    // 4. Return combined data matching your original logic + analytics
    return cors(NextResponse.json({
      ...hospital,
      metrics: {
        activeMaps: hospital._count.maps,
        activeFloors: hospital._count.floors,
        totalSessions: hospital._count.analyticsEvents,
        recentActivity: hospital.analyticsEvents.map(e => ({
          type: e.eventType,
          description: e.metadata ? JSON.stringify(e.metadata) : "User activity logged",
          time: e.createdAt
        })),
        chartData: chartData.length > 0 ? chartData : [
          { day: "Mon", sessions: 0 },
          { day: "Tue", sessions: 0 },
          { day: "Wed", sessions: 0 },
          { day: "Thu", sessions: 0 },
          { day: "Fri", sessions: 0 },
        ]
      }
    }));

  } catch (err) {
    console.error("HOSPITAL MY ERROR:", err);
    return cors(NextResponse.json({ error: "Server error" }, { status: 500 }));
  }
}
