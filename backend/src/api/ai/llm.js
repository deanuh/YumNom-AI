// backend/src/api/ai/llm.js
import OpenAI from "openai";
import "dotenv/config";

// OpenAI client configured with API key from environment
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a concise explanation for a recommended dish.
 *
 * Params:
 *  - dish: { name, cuisine, ingredients[], dietTags[] }
 *  - prompt: original user request (string)
 *  - likes: array of preferred ingredients/cuisines
 *  - restrictions: array of restricted ingredients
 *
 * Returns:
 *  - short string (2–4 sentences) explaining why this dish fits the request
 */
export async function explainDish({ dish, prompt, likes = [], restrictions = [] }) {
  const system = `You are a concise food recommendation explainer.
Write 2–4 short sentences tied to the user's prompt and preferences.
Never encourage restricted ingredients.`;
  // User context string with prompt, likes, restrictions, and dish metadata
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
   // Call OpenAI Responses API (gpt-4o-mini chosen for efficiency)
  const r = await client.responses.create({
    model: "gpt-4o-mini",
    temperature: 0.3, // low randomness for consistency
    max_output_tokens: 140, // short explanations
    input: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });

  // Return explanation text, or fallback if empty
  return r.output_text?.trim() || "A solid match for your prompt and preferences.";
}
