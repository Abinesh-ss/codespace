import prisma from "@/lib/db";
import { z } from "zod";

const regionSchema = z.object({
  country: z.string().min(2, "Country is required"),
  state: z.string().optional(),
});

export type Region = "TAMIL_NADU" | "INDIA_OTHER" | "INTERNATIONAL";

const GOV_DOMAINS = ["gov.in", "tn.gov.in"];

function isGovernmentEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return GOV_DOMAINS.includes(domain);
}

export async function assignHospitalSubscription(
  hospitalId: string,
  country: string,
  state: string | undefined,
  userEmail: string
) {
  const parsed = regionSchema.safeParse({ country, state });
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Invalid country/state: ${errors}`);
  }

  const validCountry = parsed.data.country;
  const validState = parsed.data.state;

  let region: Region = "INTERNATIONAL";
  if (validCountry.toLowerCase() === "india") {
    region =
      validState?.toLowerCase() === "tamil nadu" ? "TAMIL_NADU" : "INDIA_OTHER";
  }

  // TN government hospitals → FREE
  if (region === "TAMIL_NADU" && isGovernmentEmail(userEmail)) {
    return prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        country: validCountry,
        state: validState,
        region,
        subscriptionStatus: "FREE",
        trialEndsAt: null,
        paymentProvider: null,
      },
    });
  }

  // Other TN / India / International → 30-day TRIAL
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  return prisma.hospital.update({
    where: { id: hospitalId },
    data: {
      country: validCountry,
      state: validState,
      region,
      subscriptionStatus: "TRIAL",
      trialEndsAt,
      paymentProvider: "RAZORPAY",
    },
  });
}

export function isHospitalSubscriptionValid(hospital: {
  subscriptionStatus: string;
  trialEndsAt?: Date | null;
}): boolean {
  if (hospital.subscriptionStatus === "FREE") return true;
  if (hospital.subscriptionStatus === "ACTIVE") return true;
  if (hospital.subscriptionStatus === "TRIAL") {
    return !!hospital.trialEndsAt && hospital.trialEndsAt > new Date();
  }
  return false;
}

