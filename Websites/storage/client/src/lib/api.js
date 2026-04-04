const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user_data");
  if (!stored) return null;
  try {
    return JSON.parse(stored).token || null;
  } catch {
    return null;
  }
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── Auth ──────────────────────────────────────────────
export async function loginUser({ user_email, password }) {
  const res = await fetch(`${BASE}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Login failed");
  return json;
}

// ── Medicines ─────────────────────────────────────────
export async function getMeds({ limit = 10, offset = 0, search = "" } = {}) {
  const params = new URLSearchParams({ limit, offset, search });
  const res = await fetch(`${BASE}/meds?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch medicines");
  return res.json();
}

export async function addMed(data) {
  const res = await fetch(`${BASE}/meds`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to add medicine");
  return json;
}

export async function updateMed(med_id, data) {
  const res = await fetch(`${BASE}/meds/${med_id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update medicine");
  return json;
}
