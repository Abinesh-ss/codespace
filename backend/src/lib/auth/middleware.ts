import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isHospitalSubscriptionValid } from "@/lib/services/subscription.service";
import { auth as extractUserId } from "@/lib/auth";

/* ============================
   DYNAMIC CORS HELPERS
============================ */
function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  
  // Allow the specific frontend URL OR any mobile request (which often has no origin)
  // For production, you can add your mobile app's scheme here
  const allowedOrigin = origin === process.env.FRONTEND_URL ? origin : origin || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function addCorsHeaders(req: NextRequest, res: NextResponse) {
  const headers = getCorsHeaders(req);
  Object.entries(headers).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

/* ============================
   BEARER TOKEN PROTECTOR + CORS
============================ */
export function protectRoute(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // 1. Handle Preflight (OPTIONS)
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(req),
      });
    }

    try {
      // 2. Extract User ID (This must check both Cookies and Authorization Header)
      const userId = await extractUserId(req);

      if (!userId) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized: Please log in." }),
          { status: 401, headers: getCorsHeaders(req) }
        );
      }

      // 3. Execute Handler
      const response = await handler(req, userId);
      
      // 4. Wrap with CORS
      return addCorsHeaders(req, response);
    } catch (error: any) {
      console.error("Auth Error:", error.message);
      return new NextResponse(
        JSON.stringify({ error: "Session expired or invalid token" }),
        { status: 401, headers: getCorsHeaders(req) }
      );
    }
  };
}

/* ============================
   Auth Middleware (returns userId and email)
============================ */
export async function authMiddleware(req: NextRequest): Promise<{ userId: string; email: string }> {
  const userId = await extractUserId(req);
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return { userId, email: user.email };
}

/* ============================
   Hospital Subscription Validation
============================ */
export async function validateHospitalSubscription(hospitalId: string) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      state: true,
      country: true,
    },
  });

  if (!hospital) throw new Error("HOSPITAL_NOT_FOUND");

  const isTamilNaduGovt =
    hospital.state?.toLowerCase() === "tamil nadu" &&
    hospital.country?.toLowerCase() === "india";

  if (!isTamilNaduGovt && !isHospitalSubscriptionValid(hospital)) {
    throw new Error("SUBSCRIPTION_EXPIRED");
  }
}
