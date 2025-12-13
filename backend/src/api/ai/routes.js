// backend/src/api/ai/routes.js
import { Router } from "express";
import { explainDish, generateDish, violatesRestrictions } from "./llm.js";
import { fetchFoodImageByDish } from "../unsplash.js";
import { saveAIRating, getDishStats } from "../../firebase/feedback.js";
import { getUserBasic } from "../../firebase/dbFunctions.js"; // NEW import
import { sendAiFeedbackEmail } from "../email.js";


const router = Router();
const ratings = [];

// --- one-time debug on module load ---
console.log("[ai/routes] OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);

// ---------------- Helpers ----------------

/**
 * Extracts keywords from a free-form prompt.
 * - Strips out filler words like "I", "want", "please", etc.
 * - Returns only meaningful tokens (min length 3).
 *
 * @param {string} text - User input prompt
 * @returns {string[]} keywords
 */
function extractKeywords(text = "") {
  const stop = new Set([
    "i","im","i'm","am","are","is","the","a","an","and","or","but","please","with","without",
    "something","some","any","really","very","like","want","craving","crave","me","for",
    "food","dish","eat","to","of","in","on","at","that","this","it","you","we"
  ]);
  return String(text).toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)
    .filter(w => w.length >= 3 && !stop.has(w));
}

/**
 * Checks whether all mustInclude keywords appear
 * in the dish's metadata (name, ingredients, cuisine, tags).
 *
 * @param {Object} dish - Dish object from AI
 * @param {string[]} mustInclude - Tokens that must appear
 * @returns {boolean}
 */
function matchesMustInclude(dish, mustInclude = []) {
  const bag = new Set(
    [
      ...(dish?.name || "").toLowerCase().split(/\W+/),
      ...(dish?.ingredients || []).flatMap(s => String(s).toLowerCase().split(/\W+/)),
      ...(dish?.cuisine ? [String(dish.cuisine).toLowerCase()] : []),
      ...(dish?.dietTags || []).map(String).map(s => s.toLowerCase())
    ].filter(Boolean)
  );
  return mustInclude.every(tok => bag.has(tok));
}

/**
 * Generates a slug (URL/ID-safe string) from a dish name or text.
 * - Lowercases, replaces spaces with underscores, strips symbols.
 *
 * @param {string} s
 * @returns {string}
 */

const slug = (s = "") =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

function normList(list = []) {
  return Array.from(new Set(list.map(s => String(s).toLowerCase().trim()))).filter(Boolean);
}

const DIET_RULES = {
  vegan: ["meat","beef","pork","chicken","fish","shellfish","egg","cheese","milk","dairy","butter","honey","gelatin","yogurt"],
  vegetarian: ["meat","beef","pork","chicken","gelatin"],
  pescatarian: ["beef","pork","chicken"],
  dairy_free: ["milk","cheese","butter","yogurt","cream","whey"],
  gluten_free: ["wheat","barley","rye","farro","semolina","spelt","bulgur","malt","gluten"],
  nut_free: ["peanut","almond","cashew","walnut","pecan","hazelnut","pistachio","macadamia"],
  egg_free: ["egg"],
  shellfish_free: ["shrimp","crab","lobster","clam","mussel","oyster","scallop","shellfish"],
};

function buildBlockedTokens({ diet = {}, exclusions = {} }) {
  const types = normList(diet.types);
  const allergens = normList(diet.allergens);
  const userIng = normList(exclusions.ingredients);
  const byType = types.flatMap(t => DIET_RULES[t] || []);
  const all = normList([...byType, ...allergens, ...userIng]);
  return new Set(all);
}

function violatesProfileRestrictions(dish, blockedSet) {
  const hay = [
    String(dish?.name || "").toLowerCase(),
    String(dish?.cuisine || "").toLowerCase(),
    ...(dish?.ingredients || []).map(s => String(s).toLowerCase())
  ].join(" ");
  for (const token of blockedSet) {
    if (token && hay.includes(token)) return true;
  }
  return false;
}

// ---------- Routes ----------

/**
 * POST /api/ai/recommend
 * Generates a dish recommendation using AI.
 * - Extracts mustInclude keywords from prompt
 * - Calls `generateDish` to get AI suggestion
 * - Retries if excluded dish is suggested
 * - Validates restrictions + mustInclude requirements
 * - Attempts to improve the image (via Unsplash) if placeholder
 * - Generates a natural-language explanation
 */
router.post("/recommend", async (req, res) => {
  const { prompt = "", likes = [], restrictions = [], excludeIds = [] } = req.body || {};
  const mustInclude = extractKeywords(prompt);
  console.log("[/api/ai/recommend] ▶️", { prompt, likes, restrictions, mustInclude, excludeIds });

  try {
    // 1) Ask the model for a dish
    let ai;
    try {
      // include a soft instruction about exclusions up front
      const excludeLine =
        Array.isArray(excludeIds) && excludeIds.length
          ? `Do NOT repeat any of these dishes (or near-duplicates): ${excludeIds.join(", ")}.`
          : "";

      ai = await generateDish({ prompt: `${prompt}\n${excludeLine}`.trim(), likes, restrictions, mustInclude });
    } catch (e) {
      console.error("[/api/ai/recommend]  generateDish failed:", e?.message || e);
      return res.status(502).json({ error: "AI recommendation failed (dish)", detail: String(e?.message || e) });
    }

    // Normalize first result
    let dish = {
      id: ai?.dish?.id || slug(ai?.dish?.name || "dish"),
      name: ai?.dish?.name || "Chef's Choice",
      cuisine: ai?.dish?.cuisine || "",
      ingredients: Array.isArray(ai?.dish?.ingredients) ? ai.dish.ingredients : [],
      dietTags: Array.isArray(ai?.dish?.dietTags) ? ai.dish.dietTags : [],
      img: ai?.dish?.img || ai?.dish?.imageUrl || "/tuna.png"
    };

    // Enforce excludeIds (retry once if repeated)
    const exclude = new Set((excludeIds || []).map(slug));
    const isExcluded = exclude.has(slug(dish.id)) || exclude.has(slug(dish.name));

    if (isExcluded) {
      console.warn("[/api/ai/recommend] excluded dish returned:", dish.name);
      try {
        const retryPrompt =
          `${prompt}\n` +
          `Do NOT suggest any of these dishes (or near-duplicates): ${[...exclude].join(", ")}.\n` +
          `Pick a different dish that still fits the likes/restrictions.`;
        const retry = await generateDish({ prompt: retryPrompt, likes, restrictions, mustInclude });
        if (retry?.dish?.name) {
          dish = {
            id: retry?.dish?.id || slug(retry.dish.name),
            name: retry.dish.name,
            cuisine: retry.dish.cuisine || "",
            ingredients: Array.isArray(retry.dish.ingredients) ? retry.dish.ingredients : [],
            dietTags: Array.isArray(retry.dish.dietTags) ? retry.dish.dietTags : [],
            img: retry.dish.img || retry.dish.imageUrl || dish.img
          };
        }
      } catch (e) {
        console.warn("[/api/ai/recommend] retry after exclude failed:", e?.message || e);
      }
    }

    // Validate AI result
    if (!dish.name) {
      console.warn("[/api/ai/recommend]  no dish name");
      return res.status(502).json({ error: "AI recommendation failed (no name)" });
    }
    let userProfile = null;
    try {
      if (req.user?.uid) userProfile = await getUserBasic(req.uid);
    } catch (err) {
      console.warn("[/api/ai/recommend] could not fetch user profile:", err?.message);
    }

    // Build blocked tokens from diet + exclusions
    const blockedSet = buildBlockedTokens({
      diet: userProfile?.diet || { types: [], allergens: [] },
      exclusions: userProfile?.exclusions || { ingredients: [] },
    });

    // Merge front-end restrictions too
    for (const r of restrictions || []) blockedSet.add(String(r).toLowerCase());

    // Reject or retry if dish conflicts
    if (violatesRestrictions(dish, restrictions) || violatesProfileRestrictions(dish, blockedSet)) {
      console.warn("[/api/ai/recommend] dish violates restrictions:", [...blockedSet]);

      // Retry once with an augmented prompt
      try {
        const retryPrompt = `${prompt}\nAvoid ingredients: ${[...blockedSet].join(", ")}. Suggest a different dish.`;
        const retry = await generateDish({ prompt: retryPrompt, likes, restrictions, mustInclude });
        if (retry?.dish?.name) {
          const retryDish = retry.dish;
          if (!violatesProfileRestrictions(retryDish, blockedSet)) {
            dish = {
              id: retryDish?.id || slug(retryDish.name),
              name: retryDish.name,
              cuisine: retryDish.cuisine || "",
              ingredients: Array.isArray(retryDish.ingredients) ? retryDish.ingredients : [],
              dietTags: Array.isArray(retryDish.dietTags) ? retryDish.dietTags : [],
              img: retryDish.img || retryDish.imageUrl || dish.img
            };
          }
        }
      } catch (e) {
        console.warn("[/api/ai/recommend] retry after restriction failed:", e?.message || e);
      }

      // still invalid after retry
      if (violatesProfileRestrictions(dish, blockedSet)) {
        return res.status(422).json({ error: "Dish violates user restrictions", dish, source: "ai" });
      }
    }

    if (mustInclude.length && !matchesMustInclude(dish, mustInclude)) {
      console.warn("[/api/ai/recommend]  mustInclude not satisfied:", mustInclude, " dish:", dish.name);
      return res.status(422).json({ error: "Dish did not match required keywords", dish, source: "ai" });
    }

    // 2) Try to improve image (non-fatal)
    const looksBad =
      !dish.img ||
      dish.img === "/tuna.png" ||
      /(^https?:\/\/example\.com\/)/i.test(String(dish.img)) ||   // block obvious placeholder
      !/^https?:\/\//i.test(String(dish.img));                    // non-URL strings

    if (looksBad) {
      try {
        const better = await fetchFoodImageByDish(dish.name, dish.cuisine);
        if (better) dish.img = better;
      } catch (e) {
        console.warn("[/api/ai/recommend] image fetch failed:", e?.message || e);
      }
    }


    // 3) Get explanation (non-fatal)
    let reason = "This matches your prompt and preferences.";
    try {
      reason = await explainDish({ dish, prompt, likes, restrictions });
    } catch (e) {
      console.warn("[/api/ai/recommend] explainDish failed:", e?.message || e);
    }

    console.log("[/api/ai/recommend]  source: ai | dish:", dish.name);
    return res.json({ dish, reason, used: { likes, restrictions }, source: "ai" });
  } catch (e) {
    console.error("[/api/ai/recommend]  unexpected error:", e?.message || e);
    return res.status(502).json({ error: "AI recommendation failed (unexpected)", detail: String(e?.message || e) });
  }
});

/**
 * POST /api/ai/rate
 * Saves a user rating for a dish to Firebase.
 * Requires: dishId and rating (numeric).
 * Optional: prompt, likes, restrictions, reason, comment, tags, userId, model.
 */

router.post("/rate", async (req, res) => {
  try {
    const {
      dishId,
      rating,
      prompt = "",
      likes = [],
      restrictions = [],
      reason = "",
      comment = "",
      tags = [],
      dishName = "",
      userId = null,
      model = "gpt-4o-mini",
      sendCopyToUser = false,          // NEW
    } = req.body || {};

    if (!dishId || typeof rating !== "number") {
      return res.status(400).json({ error: "dishId and numeric rating required" });
    }

    await saveAIRating({
      dishId,
      dishName,
      rating,
      prompt,
      likes,
      restrictions,
      reason,
      comment,
      tags,
      userId,
      model,
    });

    const userEmail = req.body.userEmail || null;

    
    // Fire-and-forget email
    sendAiFeedbackEmail({
      userEmail,
      sendCopyToUser: !!sendCopyToUser,
      feedback: {
        dishName,
        rating,
        tags,
        comment,
        prompt,
        likes,
        restrictions,
        reason,
      },
    }).catch((err) =>
      console.error("[/api/ai/rate] email failed:", err?.message || err)
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("[/api/ai/rate] save failed:", e?.message || e);
    res.status(500).json({ error: "Could not save rating" });
  }
});


/**
 * GET /api/ai/rate/stats
 * Retrieves aggregated stats of recent ratings from Firebase.
 */

router.get("/rate/stats", async (_req, res) => {
  try {
    const stats = await getDishStats(20);
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: "stats failed" });
  }
});

export default router;
