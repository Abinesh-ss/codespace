import { NextResponse } from "next/server";

export function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function corsResponse(origin?: string) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

