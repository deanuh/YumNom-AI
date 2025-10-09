import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Static dish dataset (JSON file with dish objects)
const dishes = require("./data/dishes.json");

// Tokenize a string into lowercase alphanumeric words
const toWords = s =>
  (s || "").toLowerCase().match(/[a-z0-9]+/g) || [];


// "Hot" ingredients to recognize when user asks for spicy food
const HOT_INGS = [
  "chili","chile","jalapeno","habanero","sriracha","gochujang",
  "kimchi","cayenne","harissa","sambal","pepper"
];
// Simple synonym groups for semantic boosting
const SYNS = {
  spicy: new Set(["spicy","hot","fiery","heat","peppery","chili","chile"]),
  savory: new Set(["savory","umami","flavorful","rich","zesty","hearty"])
};

/**
 * Normalize a set of words to include canonical tags.
 * Example: if "fiery" is present → also include "spicy".
 */
function canonize(words) {
  const out = new Set(words);
  for (const w of words) {
    if (SYNS.spicy.has(w)) out.add("spicy");
    if (SYNS.savory.has(w)) out.add("savory");
  }
  return out;
}

/**
 * Recommend a single dish given user input.
 *
 * Params:
 *  - prompt: free-text description (string)
 *  - likes: array of liked ingredients
 *  - restrictions: array of restricted ingredients
 *  - excludeIds: dish IDs to skip (already shown)
 *
 * Returns:
 *  - one dish object from dishes.json (or null if none valid)
 */
export function recommendOne({ prompt, likes = [], restrictions = [], excludeIds = [] }) {
  // Parse + normalize words from prompt
  const words = canonize(toWords(prompt));
  const likesSet = new Set(likes.map(s => s.toLowerCase()));
  const restrictSet = new Set(restrictions.map(s => s.toLowerCase()));

  // Candidate pool (skip excluded IDs)
  const pool = dishes.filter(d => !excludeIds.includes(d.id));
  if (!pool.length) return null;

  // Score each dish
  const scored = pool.map(d => {
    let score = 0;
    const ings = (d.ingredients || []).map(x => x.toLowerCase());
    const tags = (d.dietTags || []).map(x => x.toLowerCase());
    const name = (d.name || "").toLowerCase();

    // Match cuisine directly
    if (d.cuisine && words.has(d.cuisine.toLowerCase())) score += 2;
     // Ingredient-level scoring
    for (const ing of ings) {
      if (words.has(ing)) score += 2;
      if (likesSet.has(ing)) score += 2;
      if (restrictSet.has(ing)) score -= 100; // hard block
    }

    // Boost spicy-related dishes if "spicy" detected in prompt
    if (words.has("spicy")) {
      if (tags.includes("spicy")) score += 4;
      if (name.includes("spicy")) score += 4;
      if (ings.some(i => HOT_INGS.includes(i))) score += 3;
    }

    // Light boost for savory-related flavors
    if (words.has("savory")) {
      if (ings.some(i => ["garlic","soy sauce","miso","bbq sauce","parmesan"].includes(i))) {
        score += 1;
      }
    }

    return { dish: d, score };
  });
  
  // Pick top-scoring dish (ties broken randomly among equals)
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter(s => s.score === scored[0].score);
  return top[Math.floor(Math.random() * top.length)].dish;
}
