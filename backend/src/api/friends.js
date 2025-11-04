// src/api/friends.js
import { Router } from "express";

// Import db exactly like dbFunctions.js does (ESM -> CJS)
import dbModule from "../firebase/db.cjs";
const { db } = dbModule;

const router = Router();

// Use your existing collection name
const usersCol = () => db.collection("User");

// ---- Lookup by username (case-insensitive via username_lower) ----
router.get("/users/lookup", async (req, res) => {
  try {
    const username = String(req.query.username || "").trim().toLowerCase();
    if (!username) return res.status(400).json({ error: "username required" });

    const snap = await usersCol()
      .where("username_lower", "==", username)
      .limit(1)
      .get();

    if (snap.empty) return res.sendStatus(404);

    const doc = snap.docs[0];
    const u = doc.data() || {};
    return res.json({
      user_id: doc.id,
      username: u.username || "",
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      avatarUrl: u.profile_picture || "",
    });
  } catch (err) {
    console.error("lookup error:", err);
    res.status(500).json({ error: "lookup failed" });
  }
});

// ---- List my friends ----
router.get("/me/friends", async (req, res) => {
  try {
    const meId = req.uid; // set by authMiddleware in server.js
    if (!meId) return res.status(401).json({ error: "unauthorized" });

    const meDoc = await usersCol().doc(meId).get();
    if (!meDoc.exists) return res.json([]);

    const friendIds = Array.isArray(meDoc.data().friends)
      ? meDoc.data().friends
      : [];
    if (!friendIds.length) return res.json([]);

    const docs = await Promise.all(friendIds.map((id) => usersCol().doc(id).get()));
    const rows = docs.filter(d => d.exists).map(d => {
      const x = d.data() || {};
      return {
        user_id: d.id,
        username: x.username || "",
        avatarUrl: x.profile_picture || "",
      };
    });
    res.json(rows);
  } catch (err) {
    console.error("get friends error:", err);
    res.status(500).json({ error: "failed to load friends" });
  }
});

// ---- Add friend (reciprocal) ----
router.post("/me/friends", async (req, res) => {
  try {
    const meId = req.uid;
    if (!meId) return res.status(401).json({ error: "unauthorized" });

    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    if (user_id === meId) return res.status(400).json({ error: "cannot add self" });

    const meRef = usersCol().doc(meId);
    const frRef = usersCol().doc(user_id);

    await db.runTransaction(async (tx) => {
      const [meSnap, frSnap] = await Promise.all([tx.get(meRef), tx.get(frRef)]);
      if (!meSnap.exists) throw new Error("user not found");
      if (!frSnap.exists) throw new Error("friend not found");

      const meSet = new Set(Array.isArray(meSnap.data().friends) ? meSnap.data().friends : []);
      const frSet = new Set(Array.isArray(frSnap.data().friends) ? frSnap.data().friends : []);

      meSet.add(user_id);
      frSet.add(meId);

      tx.update(meRef, { friends: Array.from(meSet) });
      tx.update(frRef, { friends: Array.from(frSet) });
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("add friend error:", err);
    if (String(err.message).includes("friend not found")) {
      return res.status(404).json({ error: "friend not found" });
    }
    res.status(500).json({ error: "failed to add friend" });
  }
});

// ---- Remove friend (reciprocal) ----
router.delete("/me/friends/:friendId", async (req, res) => {
  try {
    const meId = req.uid;
    if (!meId) return res.status(401).json({ error: "unauthorized" });

    const friendId = String(req.params.friendId || "");
    if (!friendId) return res.status(400).json({ error: "friendId required" });

    const meRef = usersCol().doc(meId);
    const frRef = usersCol().doc(friendId);

    await db.runTransaction(async (tx) => {
      const [meSnap, frSnap] = await Promise.all([tx.get(meRef), tx.get(frRef)]);
      if (!meSnap.exists) throw new Error("user not found");

      const meSet = new Set(Array.isArray(meSnap.data().friends) ? meSnap.data().friends : []);
      meSet.delete(friendId);
      tx.update(meRef, { friends: Array.from(meSet) });

      if (frSnap.exists) {
        const frSet = new Set(Array.isArray(frSnap.data().friends) ? frSnap.data().friends : []);
        frSet.delete(meId);
        tx.update(frRef, { friends: Array.from(frSet) });
      }
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("remove friend error:", err);
    res.status(500).json({ error: "failed to remove friend" });
  }
});

export default router;
