// src/userapi/friendsApi.js
import { getAuth, onAuthStateChanged } from "firebase/auth";

async function getIdTokenOrThrow() {
  const auth = getAuth();
  // Wait for auth to be ready if currentUser is null momentarily
  if (!auth.currentUser) {
    await new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve();
      });
    });
  }
  const user = getAuth().currentUser;
  if (!user) throw new Error("NO_AUTH");
  return user.getIdToken(/* forceRefresh? */ false);
}

async function authFetch(url, options = {}) {
  const token = await getIdTokenOrThrow();
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };
  // If caller provided a body but no content-type, default to json
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, { ...options, headers });
}

// ---------------- Public API ----------------

export async function lookupUserByUsername(username) {
  const res = await authFetch(
    `/api/users/lookup?username=${encodeURIComponent(username)}`
  );
  if (!res.ok) throw new Error(res.status === 404 ? "NOT_FOUND" : `Lookup failed ${res.status}`);
  return res.json();
}

export async function fetchMyFriends() {
  const res = await authFetch(`/api/me/friends`);
  if (!res.ok) throw new Error(`fetchMyFriends failed ${res.status}`);
  return res.json(); // array of friends
}

export async function addFriendById(user_id) {
  const res = await authFetch(`/api/me/friends`, {
    method: "POST",
    body: JSON.stringify({ user_id }),
  });
  if (!res.ok) throw new Error(`addFriend failed ${res.status}`);
  return res.json();
}

export async function removeFriend(friendId) {
  const res = await authFetch(`/api/me/friends/${encodeURIComponent(friendId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`removeFriend failed ${res.status}`);
  return res.json();
}
