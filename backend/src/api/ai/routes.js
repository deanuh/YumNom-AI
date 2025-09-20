// backend/src/api/ai/routes.js

// Express router exposing endpoints for dish recommendations and ratings.
import { Router } from "express";
import { recommendOne } from "./recommender.js";
import { explainDish } from "./llm.js";

const router = Router();
const ratings = [];  // Week 1: simple in-memory store (TODO: replace with DB)

/**
 * POST /recommend
 * Input: { prompt, likes[], restrictions[], excludeIds[] }
 * Flow:
 *  1. Pick one dish via recommender
 *  2. Generate explanation via LLM
 *  3. Return { dish, reason }
 */
router.post("/recommend", async (req, res, next) => {
  try {
    const { prompt = "", likes = [], restrictions = [], excludeIds = [] } = req.body || {};
    const dish = recommendOne({ prompt, likes, restrictions, excludeIds });
    if (!dish) return res.status(404).json({ error: "No dish available for those constraints." });
    const reason = await explainDish({ dish, prompt, likes, restrictions });
    res.json({ dish, reason });
  } catch (e) { next(e); }
});

/**
 * POST /rate
 * Input: { dishId, rating, prompt, likes[], restrictions[] }
 * Flow:
 *  1. Validate dishId + numeric rating
 *  2. Append to in-memory ratings array
 *  3. Return { ok: true }
 *
 * Note: Ratings are ephemeral until hooked into persistent storage.
 */
router.post("/rate", (req, res) => {
  const { dishId, rating, prompt = "", likes = [], restrictions = [] } = req.body || {};
  if (!dishId || typeof rating !== "number") return res.status(400).json({ error: "dishId and numeric rating required" });
  ratings.push({ dishId, rating, prompt, likes, restrictions, ts: Date.now() });
  res.json({ ok: true });
});

export default router;
