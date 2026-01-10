import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { protectRoute } from "@/lib/auth/middleware";

export const POST = protectRoute(async (req, userId) => {
  const { eventType, metadata } = await req.json();

  await prisma.analyticsEvent.create({
    data: {
      eventType,
      user: { connect: { id: userId } },
      metadata: metadata || {},
    },
  });

  return NextResponse.json({ success: true });
});
