// backend/src/firebase/feedback.js
// Do NOT initialize Firebase here. Reuse the db from db.cjs.

import dbModule from "./db.cjs"; 
const { db } = dbModule;

import admin from "firebase-admin";
const { FieldValue } = admin.firestore;

/**
 * Save a rating for an AI-recommended dish.
 * - Cleans and normalizes the incoming data
 * - Stores it in the "ai_ratings" collection
 * - Adds server timestamp
 *
 * @param {Object} doc - Rating object
 * @param {string} doc.dishId - Required: unique dish identifier
 * @param {string} [doc.dishName] - Optional dish name
 * @param {number} doc.rating - Numeric rating value
 * @param {string} [doc.prompt] - Original user prompt
 * @param {string[]} [doc.likes] - User likes at time of rating
 * @param {string[]} [doc.restrictions] - User restrictions at time of rating
 * @param {string} [doc.reason] - Explanation text
 * @param {string} [doc.comment] - Free-form user comment
 * @param {string[]} [doc.tags] - Extra tags
 * @param {string|null} [doc.userId] - User identifier (if available)
 * @param {string} [doc.model] - Model used for recommendation (default gpt-4o-mini)
 */

export async function saveAIRating(doc) {
  const cleaned = {
    dishId: String(doc.dishId || ""),
    dishName: String(doc.dishName || ""),
    rating: Number(doc.rating || 0),
    prompt: String(doc.prompt || ""),
    likes: Array.isArray(doc.likes) ? doc.likes : [],
    restrictions: Array.isArray(doc.restrictions) ? doc.restrictions : [],
    reason: String(doc.reason || ""),
    comment: String(doc.comment || ""),
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    userId: doc.userId ? String(doc.userId) : null,
    model: String(doc.model || "gpt-4o-mini"),
    ts: FieldValue.serverTimestamp(),
  };
  if (!cleaned.dishId) throw new Error("dishId required");
  await db.collection("ai_ratings").add(cleaned);
  return { ok: true };
}

/**
 * Aggregate ratings for dishes and compute average scores.
 * - Fetches up to 1000 recent ratings (ordered by timestamp desc)
 * - Groups by dishId
 * - Calculates average rating and count (n)
 * - Returns top "limit" dishes sorted by avg rating
 *
 * @param {number} limit - Number of top results to return (default 20)
 * @returns {Object} { rows: [ { dishId, dishName, avg, n } ] }
 */

export async function getDishStats(limit = 20) {
  const snap = await db.collection("ai_ratings").orderBy("ts", "desc").limit(1000).get();
  const map = new Map();
  // Build map: dishId → aggregate rating + count
  snap.forEach((d) => {
    const r = d.data();
    if (!map.has(r.dishId)) map.set(r.dishId, { name: r.dishName || r.dishId, sum: 0, n: 0 });
    const a = map.get(r.dishId);
    a.sum += Number(r.rating || 0);
    a.n += 1;
  });
  // Convert to array, calculate averages, sort, and limit results
  const rows = [...map.entries()]
    .map(([dishId, a]) => ({ dishId, dishName: a.name, avg: a.n ? a.sum / a.n : 0, n: a.n }))
    .sort((x, y) => y.avg - x.avg)
    .slice(0, limit);
  return { rows };
}
