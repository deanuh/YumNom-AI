// backend/src/api/ai/llm.js
import OpenAI from "openai";
import "dotenv/config";

// Create an OpenAI client using the API key stored in .env
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** ---------------- Explanation ---------------- **/
/**
 * Generates a short explanation for why a dish was recommended.
 * - Keeps explanation focused on ONE dish (no alternatives).
 * - Takes into account the user's prompt, likes, and restrictions.
 *
 * @param {Object} options - Input options
 * @param {Object} options.dish - The dish object {name, cuisine, ingredients, dietTags}
 * @param {string} options.prompt - The user’s craving input
 * @param {string[]} options.likes - User’s preferred items
 * @param {string[]} options.restrictions - Ingredients or tags to avoid
 * @returns {Promise<string>} - A short explanation text
 */
export async function explainDish({ dish, prompt, likes = [], restrictions = [] }) {
  // System instructions (AI behavior rules)
  const system = `You are a concise food recommendation explainer.
Write 2–4 short sentences that justify exactly ONE dish: "${dish?.name}".
Do NOT mention alternatives. Avoid words like "or", "also", "alternatively", "instead".
Never encourage restricted ingredients. Focus on why "${dish?.name}" matches the user.`;
  
// User message (context for the AI)
  const user = `
Prompt: ${prompt || "(none)"}
Likes: ${likes.join(", ") || "(none)"}
Restrictions: ${restrictions.join(", ") || "(none)"}

Dish:
- name: ${dish.name}
- cuisine: ${dish.cuisine || "unknown"}
- ingredients: ${(dish.ingredients || []).join(", ") || "(unknown)"}
- tags: ${(dish.dietTags || []).join(", ") || "(none)"}
`;

// Call OpenAI to generate the explanation
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });

  // Get the text response, or fallback if AI fails
  const text = (r.choices?.[0]?.message?.content || "").trim()
    || "A solid match for your prompt and preferences.";
  // Clean up the response and return it
  return sanitizeReason(text, dish?.name);
}
/**
 * Cleans the explanation text by removing banned words/phrases.
 * Prevents the AI from suggesting alternatives.
 *
 * @param {string} reason - AI-generated explanation
 * @param {string} dishName - Dish name for fallback
 * @returns {string} - Sanitized explanation
 */
export function sanitizeReason(reason, dishName = "") {
  const ban = /\b(or|also|alternatively|instead|another option)\b/i;
  const sentences = String(reason).split(/(?<=[.!?])\s+/);
  const kept = sentences.filter(s => !ban.test(s));
  const out = kept.join(" ").trim();
  return out || `This matches your preferences and highlights ${dishName}.`;
}

/** ---------------- Validation ---------------- **/
/**
 * Checks if a dish violates user restrictions.
 * - Looks at dish ingredients, diet tags, and dish name.
 *
 * @param {Object} dish - The dish to validate
 * @param {string[]} restrictions - Restricted items
 * @returns {boolean} - True if dish violates restrictions
 */
export function violatesRestrictions(dish, restrictions = []) {
  const rest = new Set((restrictions || []).map(s => String(s).toLowerCase().trim()));
  const ing  = (dish?.ingredients || []).map(s => String(s).toLowerCase().trim());
  const tags = (dish?.dietTags || []).map(s => String(s).toLowerCase().trim());
  const name = String(dish?.name || "").toLowerCase();
  // If any restriction is found in name, tags, or ingredients → invalid
  for (const r of rest) if (ing.includes(r) || tags.includes(r) || name.includes(r)) return true;
  return false;
}

/** ---------------- Dish Generation (JSON) ---------------- **/
/**
 * Generates a new dish recommendation based on user input.
 * - Must always satisfy cravings in the prompt.
 * - Avoids restricted ingredients.
 * - Includes must-have items from mustInclude[].
 * - Returns dish info in strict JSON format.
 *
 * @param {Object} options - Input context
 * @param {string} options.prompt - User’s craving description
 * @param {string[]} options.likes - User preferences
 * @param {string[]} options.restrictions - Restricted items
 * @param {string[]} options.mustInclude - Items that must be included
 * @returns {Promise<Object>} - { dish, reason }
 */
export async function generateDish({ prompt = "", likes = [], restrictions = [], mustInclude = [] }) {
  // System instructions for AI
  const system = `You are a culinary assistant. Recommend ONE real dish.
NEVER include restricted ingredients.
Prefer liked items when sensible.
The dish MUST always match the user's stated craving in the prompt (e.g., if they mention "tuna",
the dish must clearly feature tuna in its name or ingredients).
The dish MUST clearly feature any tokens listed in mustInclude[].
On repeated calls with the same prompt, suggest a different dish that STILL matches the craving.
Return ONLY JSON with keys: dish{name,cuisine,ingredients[],dietTags[],imageUrl}, reason.`;
  
// Normalize and clean input context
  const ctx = { 
    prompt: String(prompt), 
    likes: [...new Set((likes||[]).map(s=>String(s).toLowerCase().trim()))], 
    restrictions: [...new Set((restrictions||[]).map(s=>String(s).toLowerCase().trim()))],
    mustInclude: Array.from(new Set((mustInclude||[]).map(s=>String(s).toLowerCase().trim()))),
  };
// Request dish generation from OpenAI
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" }, // stable + supported
    messages: [
      { role: "system", content: system },
      { role: "user",   content: `User context: ${JSON.stringify(ctx)}\nReturn ONLY JSON.` }
    ],
  });
  
  // Parse AI response
  let out = {};
  try {
    out = JSON.parse(r.choices?.[0]?.message?.content || "{}");
  } catch {
    throw new Error("AI did not return valid JSON");
  }

  // Construct dish object safely
  const dish = {
    name: out?.dish?.name || "",
    cuisine: out?.dish?.cuisine || "",
    ingredients: Array.isArray(out?.dish?.ingredients) ? out.dish.ingredients : [],
    dietTags: Array.isArray(out?.dish?.dietTags) ? out.dish.dietTags : [],
    imageUrl: out?.dish?.imageUrl || "/ai_rec_white.png",
  };
  const reason = out?.reason || "";

  return { dish, reason };
}
