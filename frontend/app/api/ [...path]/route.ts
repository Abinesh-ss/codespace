import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!; // e.g. https://api.yourdomain.com

export async function GET(req: NextRequest, { params }: any) {
  return proxy(req, params);
}

export async function POST(req: NextRequest, { params }: any) {
  return proxy(req, params);
}

export async function PUT(req: NextRequest, { params }: any) {
  return proxy(req, params);
}

export async function DELETE(req: NextRequest, { params }: any) {
  return proxy(req, params);
}

async function proxy(req: NextRequest, params: any) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/api/${path}`;

  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": req.headers.get("content-type") || "application/json",
      Cookie: req.headers.get("cookie") || "",
      Authorization: req.headers.get("authorization") || "",
    },
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.text(),
  });

  const response = new NextResponse(res.body, res);

  return response;
}

