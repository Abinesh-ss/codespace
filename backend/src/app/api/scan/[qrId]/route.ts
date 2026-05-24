import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

function setPublicCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function OPTIONS() {
  return setPublicCors(new NextResponse(null, { status: 204 }));
}

export async function GET(
  req: NextRequest,
  { params }: { params: { qrId: string } }
) {
  try {
    const { qrId } = params;

    if (!qrId) {
      return setPublicCors(NextResponse.json({ error: "Missing QR unique reference identifier" }, { status: 400 }));
    }

    const poi = await prisma.poi.findUnique({
      where: { qrId },
      include: {
        floor: {
          select: {
            id: true,
            name: true,
            hospitalId: true,
            level: true,
          }
        }
      }
    });

    if (!poi) {
      return setPublicCors(NextResponse.json({ error: "QR Code not registered to any location point" }, { status: 404 }));
    }

    return setPublicCors(
      NextResponse.json({
        success: true,
        nodeId: poi.nodeId,
        name: poi.name,
        type: poi.type,
        x: poi.x,
        y: poi.y,
        floorId: poi.floorId,
        floorLevel: poi.floor.level,
        hospitalId: poi.floor.hospitalId,
      })
    );
  } catch (error: any) {
    console.error("Public Scan Parsing Error:", error);
    return setPublicCors(NextResponse.json({ error: "Failed to resolve destination reference point" }, { status: 500 }));
  }
}
