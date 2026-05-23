import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/* ---------------- CORS ---------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/* ---------------- OPTIONS HANDLER ---------------- */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

/* ---------------- GET ---------------- */
export async function GET() {
  try {
    // Find the first hospital in the DB
    const hospital = await prisma.hospital.findFirst({
      select: {
        id: true,
        name: true,
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: "No hospital found" },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    return NextResponse.json(hospital, {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Hospital Fetch Error:", err);

    return NextResponse.json(
      { error: "Fetch failed" },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
