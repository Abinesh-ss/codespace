import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { hospitalId: string } }
) {
  try {
    // 1. Log the incoming request for debugging
    const hospitalId = params.hospitalId;
    console.log("Fetching POIs for Hospital ID:", hospitalId);

    // 2. Fetch POIs
    const locations = await prisma.poi.findMany({
      where: {
        map: {
          hospitalId: hospitalId,
        },
      },
      include: {
        map: true // Includes the map details just in case
      }
    });

    console.log(`Found ${locations.length} locations`);

    // 3. Return a clean array
    return NextResponse.json(locations);
  } catch (err: any) {
    console.error("DATABASE ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
