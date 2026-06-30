import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; // Fixed to use your centralized DB singleton
import { assignHospitalSubscription } from "@/lib/services/subscription.service";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Authorized origins list matching your development codespace environment
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://hospinav.vercel.app",
  "https://codespace-f.vercel.app",
];

/* ---------------- schema ---------------- */
const hospitalSchema = z.object({
  name: z.string().min(3),
  address: z.string().min(5),
  country: z.string(),
  state: z.string().optional(),
});

/* ---------------- DYNAMIC CORS HELPER ---------------- */
function cors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    // Graceful fallback to prevent browser undefined matching failure logs
    res.headers.set("Access-Control-Allow-Origin", "https://codespace-f.vercel.app");
  }

  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  return res;
}

/* ---------------- CORS PREFLIGHT ---------------- */
export async function OPTIONS(req: NextRequest) {
  return cors(req, new NextResponse(null, { status: 204 }));
}

/* ---------------- AUTHENTICATION CHECK ---------------- */
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

/* ---------------- POST (REGISTER HOSPITAL) ---------------- */
export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await authMiddleware(req);

    const body = await req.json();
    const parsed = hospitalSchema.safeParse(body);
    
    if (!parsed.success) {
      return cors(req, NextResponse.json({ error: "Invalid input. Check name and address length." }, { status: 400 }));
    }

    // --- Region Detection Logic ---
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
    }

    return cors(req, NextResponse.json(hospital, { status: 201 }));

  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    const status = (err.message === "Unauthorized" || err.message === "Invalid token") ? 401 : 500;
    return cors(req, NextResponse.json({ error: err.message || "Server error" }, { status }));
  }
}
