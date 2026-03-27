export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/db/index";
import { protectRoute } from "@/lib/auth/middleware";

export const GET = protectRoute(async (req, userId) => {
  const total = await prisma.analyticsEvent.count({ where: { eventType: "NAVIGATION" } });
  const today = await prisma.analyticsEvent.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  return NextResponse.json({
    totalNavigations: total,
    todayNavigations: today,
  });
});

