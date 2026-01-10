import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.userId) {
        await prisma.user.update({
          where: { id: session.metadata.userId },
          data: {
            stripeCustomerId: session.customer as string,
            planStatus: "PRO",
            creditsRemaining: 100,
          },
        });
      }

      if (session.metadata?.hospitalId) {
        await prisma.hospital.update({
          where: { id: session.metadata.hospitalId },
          data: {
            subscriptionStatus: "ACTIVE",
            paymentProvider: "STRIPE",
            trialEndsAt: null,
          },
        });
      }

      if (session.subscription && session.metadata?.userId) {
        await prisma.subscription.upsert({
          where: { userId: session.metadata.userId },
          update: {
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: session.metadata.priceId,
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          },
          create: {
            userId: session.metadata.userId,
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: session.metadata.priceId,
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      await prisma.subscription.update({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: "canceled",
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });

      await prisma.user.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { planStatus: "FREE" },
      });

      await prisma.hospital.updateMany({
        where: {
          paymentProvider: "STRIPE",
          createdByUser: {
            in: (
              await prisma.user.findMany({
                where: { stripeCustomerId: sub.customer as string },
                select: { id: true },
              })
            ).map(u => u.id),
          },
        },
        data: { subscriptionStatus: "EXPIRED" },
      });
      break;
    }
  }

  return new NextResponse(null, { status: 200 });
}
