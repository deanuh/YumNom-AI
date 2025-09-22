// backend/src/api/deleteUser.js
// this is an api file to make sure the user info will be deleted from database (emulator for testing)
import express from "express";
import admin from "firebase-admin";
import { deleteUser as deleteUserDoc } from "../firebase/dbFunctions.js";  // need for when we actually put in database

const router = express.Router();

/**
 * Auth middleware
 * expects: Authorization: Bearer <Firebase ID token>
 * This will be to get acurate and actual user info, we have to auth that it is user ID
 */
async function authMiddleware(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // { uid, email, ... }
    next();
  } 
  catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * The process of DELETE /api/users/:userId
 * - only the signed-in user can delete their account
 * - firestore cleanup (if user doc exists)  *** find a way to add the user to firestore when they sign up
 * - delete the Auth user
 */
router.delete("/users/:userId", authMiddleware, async (req, res) => {  // deleting them
  const { userId } = req.params;

  if (req.user.uid !== userId) {
    return res.status(403).json({ error: "Forbidden" });  // just in case
  }

  try {
    // trying firestore clean up if the user is in there, if not then continue
    try {
      await deleteUserDoc(userId);
    } 
    catch (e) {
      const msg = String(e?.message || e);
      if (!msg.includes("User does not exist")) throw e;
    }

    // delete the Firebase Auth user
    await admin.auth().deleteUser(userId);

    return res.status(200).json({ ok: true });
  } 
  catch (err) {
    console.error("Delete user failed:", err);
    return res.status(500).json({ error: err.message || "deleteUser failed" });
  }
});

export default router;

