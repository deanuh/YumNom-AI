import axios from "axios";
import { getAuth } from "firebase/auth";

async function authHeader() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function ensureMe(defaults = {}) {
  const headers = await authHeader();
  const { data } = await axios.post("/api/me/ensure", defaults, { headers });
  return data;
}

export async function fetchMe() {
  const headers = await authHeader();
  const { data } = await axios.get("/api/me", { headers });
  return data;
}

export async function updateMe(payload) {
  const headers = await authHeader();
  const { data } = await axios.put("/api/me", payload, { headers });
  return data;
}

if (typeof window !== "undefined") {
  window.__meApi = { ensureMe, fetchMe, updateMe };
}