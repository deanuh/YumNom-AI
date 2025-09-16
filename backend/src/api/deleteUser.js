// backend/src/api/users.js
import express from "express";
import { deleteUser } from "../firebase/dbFunctions.js";

const router = express.Router();

// DELETE /api/users/:userId
router.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await deleteUser(userId);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Delete user failed:", err);
    res.status(500).json({ error: err.message || "deleteUser failed" });
  }
});

export default router;
