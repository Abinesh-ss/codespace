import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature")!;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const hospitalId = event.payload.payment.entity.notes.hospitalId;

    await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        subscriptionStatus: "ACTIVE",
        paymentProvider: "RAZORPAY",
        trialEndsAt: null,
      },
    });
  }

  return NextResponse.json({ success: true });
}
