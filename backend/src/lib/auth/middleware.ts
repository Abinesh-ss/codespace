import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";
import { isHospitalSubscriptionValid } from "@/lib/services/subscription.service";

/* ============================
   TOKEN EXTRACTOR
============================ */
async function extractUserId(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get("authorization");
    const tokenFromHeader = authHeader?.replace("Bearer ", "");

    const tokenFromCookie = req.cookies.get("token")?.value;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) return null;

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    return decoded.userId || null;
  } catch (error) {
    return null;
  }
}

/* ============================
   DYNAMIC CORS HELPERS
============================ */
function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "";

  const allowedOrigin =
    origin === process.env.FRONTEND_URL
      ? origin
      : process.env.FRONTEND_URL || "*";

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
   PROTECT ROUTE WRAPPER
============================ */
export function protectRoute(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    /* Handle OPTIONS (CORS Preflight) */
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(req),
      });
    }

    try {
      const userId = await extractUserId(req);

      if (!userId) {
        return new NextResponse(
          JSON.stringify({
            error: "Unauthorized",
            message: "Please login again",
          }),
          {
            status: 401,
            headers: getCorsHeaders(req),
          }
        );
      }

      const response = await handler(req, userId);

      return addCorsHeaders(req, response);
    } catch (error: any) {
      console.error("Auth Error:", error);

      return new NextResponse(
        JSON.stringify({
          error: "Session expired",
          message: "Invalid or expired token",
        }),
        {
          status: 401,
          headers: getCorsHeaders(req),
        }
      );
    }
  };
}

/* ============================
   AUTH MIDDLEWARE
============================ */
export async function authMiddleware(
  req: NextRequest
): Promise<{ userId: string; email: string }> {
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
   HOSPITAL SUBSCRIPTION CHECK
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

  if (!hospital) {
    throw new Error("HOSPITAL_NOT_FOUND");
  }

  const isTamilNaduGovt =
    hospital.state?.toLowerCase() === "tamil nadu" &&
    hospital.country?.toLowerCase() === "india";

  if (!isTamilNaduGovt && !isHospitalSubscriptionValid(hospital)) {
    throw new Error("SUBSCRIPTION_EXPIRED");
  }
}
