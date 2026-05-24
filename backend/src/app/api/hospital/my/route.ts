import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL!;

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: NextRequest) {
  try {
    // =========================
    // AUTH
    // =========================
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return cors(
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

    // =========================
    // AUTO CREATE FOR NEW USER
    // =========================
    if (!hospital) {
      hospital = await prisma.hospital.create({
        data: {
          createdByUser: payload.userId,

          // Required fields
          name: "New Hospital",
          address: "Not Set",
          country: "India",
          region: "TAMIL_NADU",
          subscriptionStatus: "FREE",
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
      NextResponse.json(
        { error: "Server error" },
        { status: 500 }
      )
    );
  }
}
