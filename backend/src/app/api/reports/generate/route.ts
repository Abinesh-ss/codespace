export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { protectRoute } from "@/lib/auth/middleware";

export const GET = protectRoute(async (req, userId) => {
  const stats = await prisma.analyticsEvent.groupBy({
    by: ["eventType"],
    _count: true,
  });

  return NextResponse.json({
    generatedAt: new Date(),
    stats,
  });
});

