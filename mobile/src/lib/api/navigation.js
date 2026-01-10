import Constants from "expo-constants";

// Updated to use the correct config path for SDK 54
const API_BASE = Constants.expoConfig?.extra?.API_BASE_URL || "";

export async function fetchPath(hospitalId, startNodeId, endNodeId, userEmail, token) {
  const body = { hospitalId, startNodeId, endNodeId };
  if (userEmail) body.userEmail = userEmail;

  const res = await fetch(`${API_BASE}/api/navigation/shortest-path`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || "Failed to fetch path");
  }

  return res.json();
}
