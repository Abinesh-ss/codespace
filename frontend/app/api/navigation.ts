const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function getShortestPath(payload: {
  floorId: string;
  startNodeId: string;
  endNodeId: string;
}) {
  // --- Subscription & region checks (UNCHANGED) ---
  const subscriptionStatus = localStorage.getItem("subscriptionStatus");
  const region = localStorage.getItem("region");
  const email = localStorage.getItem("userEmail") || "";
  const domain = email.split("@")[1] || "";

  // Tamil Nadu Govt hospitals → free access
  if (region === "TAMIL_NADU" && domain.endsWith("gov.in")) {
    // allowed
  } else if (!subscriptionStatus || subscriptionStatus === "TRIAL") {
    const trialEnds = localStorage.getItem("trialEndsAt");
    if (trialEnds && new Date(trialEnds) < new Date()) {
      throw new Error("Subscription expired. Please upgrade.");
    }
  }

  // --- API call (FIXED for ngrok / prod) ---
  const res = await fetch(
    `${API_BASE}/api/navigation/shortest-path`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error("Navigation failed");
  }

  return res.json();
}

