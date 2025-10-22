import axios from "axios";
import { getAuth } from "firebase/auth";

async function authHeader() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function ensureMe(body) {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch("/api/me/ensure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`POST /api/me/ensure failed: ${res.status}`);
  return res.json();
}

export async function fetchMe() {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`GET /api/me failed: ${res.status}`);
  return res.json();
}

export async function updateMe(body) {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch("/api/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`PUT /api/me failed: ${res.status}`);
  return res.json();
}
if (typeof window !== "undefined") {
  window.__meApi = { ensureMe, fetchMe, updateMe };
}