import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// This is a public route (no auth required) because visitors scan it
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalId, type, metadata } = body;

    if (!hospitalId) {
      return NextResponse.json({ error: "Hospital ID required" }, { status: 400 });
    }

    // Create the event in your AnalyticsEvent table
    const event = await prisma.analyticsEvent.create({
      data: {
        eventType: type || "QR_SCAN",
        hospitalId: hospitalId,
        metadata: metadata || {}, // e.g., { floor: "Level 1", poi: "Emergency" }
      },
    });

    return NextResponse.json({ success: true, id: event.id });
  } catch (err) {
    console.error("ANALYTICS_RECORD_ERROR:", err);
    return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
  }
}
