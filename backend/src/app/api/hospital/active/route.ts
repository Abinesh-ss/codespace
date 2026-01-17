import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Find the first hospital in the DB
    const hospital = await prisma.hospital.findFirst({
      select: { id: true, name: true }
    });

    if (!hospital) {
      return NextResponse.json({ error: "No hospital found" }, { status: 404 });
    }

    return NextResponse.json(hospital);
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
