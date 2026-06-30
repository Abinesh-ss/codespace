import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; // Fixed to use centralized database singleton instance
import jwt from "jsonwebtoken";

// List of allowed origins matching your environment setup
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://hospinav.vercel.app",
  "https://codespace-f.vercel.app",
];

// Dynamically set CORS depending on incoming request
function cors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    // Fallback if no origin matches
    res.headers.set("Access-Control-Allow-Origin", "https://codespace-f.vercel.app");
  }

  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");

  return res;
}

export async function OPTIONS(req: NextRequest) {
  return cors(req, new NextResponse(null, { status: 204 }));
}

export async function GET(req: NextRequest) {
  try {
    // =========================
    // AUTH
    // =========================
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return cors(
        req,
        NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      );
    }

    let payload: any;

    try {
      payload = jwt.verify(
        token,
        process.env.JWT_SECRET!
      );
    } catch {
      return cors(
        req,
        NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      );
    }

    // =========================
    // GET EXISTING HOSPITAL
    // =========================
    let hospital = await prisma.hospital.findFirst({
      where: {
        createdByUser: payload.userId,
      },

      include: {
        _count: {
          select: {
            maps: true,
            floors: true,
            analyticsEvents: true,
          },
        },

        analyticsEvents: {
          take: 5,

          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!hospital) {
      return cors(req, NextResponse.json({ error: "No hospital found" }, { status: 404 }));
    }


    // =========================
    // LAST 7 DAYS ANALYTICS
    // =========================
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 7
    );

    const recentEvents =
      await prisma.analyticsEvent.findMany({
        where: {
          hospitalId: hospital.id,

          createdAt: {
            gte: sevenDaysAgo,
          },
        },

        select: {
          createdAt: true,
        },
      });

    // =========================
    // GROUP EVENTS BY DAY
    // =========================
    const dayCounts: Record<
      string,
      number
    > = {};

    recentEvents.forEach((event) => {
      const dayName = new Date(
        event.createdAt
      ).toLocaleDateString("en-US", {
        weekday: "short",
      });

      dayCounts[dayName] =
        (dayCounts[dayName] || 0) + 1;
    });

    const chartData = Object.entries(
      dayCounts
    ).map(([day, sessions]) => ({
      day,
      sessions,
    }));

    // =========================
    // RESPONSE
    // =========================
    return cors(
      req,
      NextResponse.json({
        ...hospital,

        metrics: {
          activeMaps:
            hospital._count.maps,

          activeFloors:
            hospital._count.floors,

          totalSessions:
            hospital._count
              .analyticsEvents,

          recentActivity:
            hospital.analyticsEvents.map(
              (e) => ({
                type: e.eventType,

                description: e.metadata
                  ? typeof e.metadata ===
                    "string"
                    ? e.metadata
                    : JSON.stringify(
                        e.metadata
                      )
                  : "Activity logged",

                time: e.createdAt,
              })
            ),

          chartData:
            chartData.length > 0
              ? chartData
              : [
                  {
                    day: "Mon",
                    sessions: 0,
                  },
                  {
                    day: "Tue",
                    sessions: 0,
                  },
                  {
                    day: "Wed",
                    sessions: 0,
                  },
                  {
                    day: "Thu",
                    sessions: 0,
                  },
                  {
                    day: "Fri",
                    sessions: 0,
                  },
                ],
        },
      })
    );
  } catch (err) {
    console.error(
      "HOSPITAL MY ERROR:",
      err
    );

    return cors(
      req,
      NextResponse.json(
        { error: "Server error" },
        { status: 500 }
      )
    );
  }
}
