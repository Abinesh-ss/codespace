import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ensure this matches your prisma import path
import { assignHospitalSubscription } from "@/lib/services/subscription.service";
import { z } from "zod";
import jwt from "jsonwebtoken";

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL!;

/* ---------------- schema ---------------- */
const hospitalSchema = z.object({
  name: z.string().min(3),
  address: z.string().min(5),
  country: z.string(),
  state: z.string().optional(),
});

/* ---------------- CORS ---------------- */
function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", FRONTEND);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

/* ---------------- AUTH ---------------- */
async function authMiddleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) throw new Error("Unauthorized");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };
    return payload;
  } catch {
    throw new Error("Invalid token");
  }
}

/* ---------------- POST ---------------- */
export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await authMiddleware(req);

    const body = await req.json();
    const parsed = hospitalSchema.safeParse(body);
    
    if (!parsed.success) {
      return cors(NextResponse.json({ error: "Invalid input. Check name and address length." }, { status: 400 }));
    }

    // --- Enhanced Region Detection ---
    const countryStr = parsed.data.country.toLowerCase().trim();
    const stateStr = parsed.data.state?.toLowerCase().trim() || "";

    let region: "TAMIL_NADU" | "INDIA_OTHER" | "INTERNATIONAL" = "INTERNATIONAL";
    
    if (countryStr === "india") {
      region = stateStr === "tamil nadu" ? "TAMIL_NADU" : "INDIA_OTHER";
    }

    // --- Create Hospital ---
    const hospital = await prisma.hospital.create({
      data: {
        name: parsed.data.name,
        country: parsed.data.country,
        state: parsed.data.state,
        address: parsed.data.address,
        createdByUser: userId,
        region: region,
        subscriptionStatus: "TRIAL",
      },
    });

    // --- Initialize Subscription ---
    try {
      await assignHospitalSubscription(
        hospital.id,
        parsed.data.country,
        parsed.data.state,
        email
      );
    } catch (subErr) {
      console.error("SUBSCRIPTION ASSIGNMENT ERROR:", subErr);
      // We don't necessarily want to crash the whole request if the sub-service is down, 
      // but we should log it for manual fixing.
    }

    return cors(NextResponse.json(hospital, { status: 201 }));

  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    const status = err.message === "Unauthorized" ? 401 : 500;
    return cors(NextResponse.json({ error: err.message || "Server error" }, { status }));
  }
}
