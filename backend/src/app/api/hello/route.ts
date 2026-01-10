export function GET() {
  return new Response(
    JSON.stringify({ message: "API WORKING" }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

