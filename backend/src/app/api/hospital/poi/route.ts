import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/* ---------- CORS helpers (local, no flow change) ---------- */
function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

/* ---------- REQUIRED for browser preflight ---------- */
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/* ---------- GET (unchanged logic) ---------- */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;

  try {
    const locations = await prisma.poi.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        x: true,
        y: true,
        map: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(locations, {
      headers: corsHeaders(origin),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Fetch failed" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

/* ---------- POST (unchanged flow) ---------- */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;

  try {
    const body = await req.json();
    const { action, mapId } = body;

    if (action === "IDENTIFY_AUTO") {
      return NextResponse.json(
        { success: true, mapId },
        { status: 201, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 201, headers: corsHeaders(origin) }
    );
  } catch {
    return NextResponse.json(
      { error: "Database sync failed" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

