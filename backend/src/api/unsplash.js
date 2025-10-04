import axios from "axios";

const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

// Simple in-memory cache: query string → array of URLs
const cache = Object.create(null);

// Brand-specific query expansions ----
// If the restaurant name matches one of these brands, use a tailored search query.
const BRAND_QUERY = {
  "subway": "sub sandwich hoagie deli sandwich on baguette lettuce tomato",
  "mcdonald": "burger and fries fast food burger",
  "burger king": "burger and fries fast food burger",
  "jack in the box": "burger and fries fast food burger",
  "wendy": "burger and fries",
  "chick-fil-a": "chicken sandwich waffle fries",
  "popeyes": "fried chicken sandwich",
  "kfc": "fried chicken bucket",
  "domino": "pepperoni pizza pizza box",
  "papa john": "pepperoni pizza pizza box",
  "little caesars": "pepperoni pizza pizza box",
  "pizza hut": "pepperoni pizza pan pizza",
  "chipotle": "burrito bowl mexican rice beans",
  "taco bell": "tacos fast food",
  "starbucks": "coffee to-go latte cup",
  "dunkin": "coffee donuts",
  "wingstop": "chicken wings",
  "panda express": "chinese takeout orange chicken",
  "shake shack": "smash burger fries",
};

// Cuisine keyword query expansions ----
// Used if the restaurant name contains a cuisine/food keyword.
const CUISINE_QUERY = {
  "thai": "thai food pad thai curry basil stir fry",
  "mexican": "tacos burrito bowl mexican food",
  "pizza": "pepperoni pizza pizza slice",
  "burger": "burger and fries",
  "sushi": "sushi rolls nigiri",
  "ramen": "ramen noodles bowl",
  "pho": "pho vietnamese soup",
  "bbq": "barbecue ribs brisket",
  "seafood": "seafood plate shrimp fish",
  "bakery": "bakery pastries bread",
  "cafe": "coffee latte croissant",
  "chicken": "fried chicken chicken tenders",
  "sandwich": "deli sandwich sub",
  "breakfast": "pancakes waffles breakfast plate",
};

/**
 * Deterministic hash function for a seed string.
 * Used to pick a consistent Unsplash image per restaurant ID.
 */
function hashSeed(seed) {
  const s = String(seed || "");
  let h = 2166136261;  // FNV-like start value
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0);  // unsigned
}

/**
 * Build an Unsplash query string given:
 *  - category: a broad type like "pizza" or "burger"
 *  - name: the venue’s name (used for brand/cuisine detection)
 *
 * Priority:
 *  1. Brand match in name (Subway, Starbucks, etc.)
 *  2. Cuisine keyword match (pizza, ramen, etc.)
 *  3. Category string
 *  4. Generic fallback
 */
export function categoryToQuery(category = "food", name = "") {
  const n = (name || "").toLowerCase();

  // 1) Brand match first
  for (const key of Object.keys(BRAND_QUERY)) {
    if (n.includes(key)) return BRAND_QUERY[key];
  }

  // 2) Cuisine/keyword in the name
  for (const key of Object.keys(CUISINE_QUERY)) {
    if (n.includes(key)) return CUISINE_QUERY[key];
  }

  // 3) Fall back to coarse category
  const c = (category || "").toLowerCase();
  if (c.includes("pizza")) return CUISINE_QUERY.pizza;
  if (c.includes("burger")) return CUISINE_QUERY.burger;
  if (c.includes("sushi")) return CUISINE_QUERY.sushi;
  if (c.includes("seafood")) return CUISINE_QUERY.seafood;
  if (c.includes("bakery") || c.includes("cafe")) return CUISINE_QUERY.bakery;
  if (c.includes("chicken")) return CUISINE_QUERY.chicken;

  // Last resort
  return "restaurant dish plated food";
}

/**
 * Fetch and cache Unsplash results for a query.
 * - Uses Unsplash search API
 * - Returns an array of image URLs (regular or small size)
 * - Applies caching to avoid repeated API calls
 */
async function getResultSet(query) {
  if (!unsplashKey) {
    console.error("Missing UNSPLASH_ACCESS_KEY in .env");
    return [];
  }
  if (cache[query]) return cache[query];

  try {
    const { data } = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query,
        per_page: 20,              
        orientation: "landscape",
        content_filter: "high",
      },
      headers: { Authorization: `Client-ID ${unsplashKey}` },
    });

    const urls = Array.isArray(data?.results)
      ? data.results.map(r => r?.urls?.regular || r?.urls?.small).filter(Boolean)
      : [];

    cache[query] = urls;
    return urls;
  } catch (err) {
    console.error("Unsplash API error:", err.response?.data || err.message);
    return [];
  }
}

/**
 * Fetch and cache Unsplash results for a query.
 * - Uses Unsplash search API
 * - Returns an array of image URLs (regular or small size)
 * - Applies caching to avoid repeated API calls
 */
export async function fetchUnsplashImageFor(category, seed, name = "") {
  const query = categoryToQuery(category, name);
  const set = await getResultSet(query);
  if (!set.length) return null;

  const idx = hashSeed(seed) % set.length;
  return set[idx];
}

/**
 * Fetch a food-related image based on dish name + cuisine.
 * - Example: ("Pad Thai", "Thai") → search Unsplash
 * - Filters results to ensure they look like food
 */

export async function fetchFoodImageByDish(name, cuisine = "") {
  if (!unsplashKey) {
    console.error("Missing UNSPLASH_ACCESS_KEY in .env");
    return null;
  }

  const q = `${name} ${cuisine || ""} food dish plated`.trim();

  try {
    const { data } = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query: q,
        per_page: 12,
        orientation: "portrait",
        content_filter: "high",
      },
      headers: { Authorization: `Client-ID ${unsplashKey}` },
    });

    const results = Array.isArray(data?.results) ? data.results : [];
    
    // Check if photo looks like food
    const looksFoody = (r) => {
      const alt = (r?.alt_description || "").toLowerCase();
      const tags = (r?.tags || []).map(t => (t.title || "").toLowerCase());
      return (
        /\b(food|dish|meal|cuisine|plate|bowl|noodles|soup|salad|sushi|pizza|burger|taco|stir[-\s]?fry)\b/.test(alt) ||
        tags.some(t => /\b(food|dish|meal|cuisine|plate|bowl|restaurant|cooking)\b/.test(t))
      );
    };

    // Pick the first "foody" image, or fallback to first result
    const pick = results.find(looksFoody) || results[0];
    return pick?.urls?.regular || pick?.urls?.small || null;
  } catch (err) {
    console.error("Unsplash dish fetch failed:", err.message);
    return null;
  }
}