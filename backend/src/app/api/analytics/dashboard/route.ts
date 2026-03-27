export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/db/index";
import { protectRoute } from "@/lib/auth/middleware";

export const GET = protectRoute(async (req, userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalNavigations,
    todayNavigations,
    dashboardViews,
    reportDownloads,
  ] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { eventType: "NAVIGATION_START" },
    }),
    prisma.analyticsEvent.count({
      where: {
        eventType: "NAVIGATION_START",
        createdAt: { gte: today },
      },
    }),
    prisma.analyticsEvent.count({
      where: { eventType: "DASHBOARD_VIEW" },
    }),
    prisma.analyticsEvent.count({
      where: { eventType: "REPORT_DOWNLOAD" },
    }),
  ]);

  return NextResponse.json({
    totalNavigations,
    todayNavigations,
    dashboardViews,
    reportDownloads,
  });
});

