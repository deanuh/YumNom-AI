// tripadvisor.js
import axios from "axios";
import "dotenv/config";
import { fetchUnsplashImageFor } from "./unsplash.js";

// API setup
const api_key = process.env.TRIPADVISOR_API_KEY;
const base_url = "https://api.content.tripadvisor.com/api";
// Utility: normalize empty strings → undefined
const emptyToUndef = (v) => (v && String(v).trim() !== "" ? v : undefined);

/**
 * Helper: fetch ONE primary photo URL for a TripAdvisor location
 * - Uses /v1/location/{id}/photos
 * - Returns large/medium/original image if available
 * - Returns null on error or missing data
 */
async function fetchPrimaryPhoto(locationId) {
  try {
    const { data } = await axios.get(
      `${base_url}/v1/location/${locationId}/photos`,
      { params: { key: api_key, limit: 1 } }
    );
    const first = data?.data?.[0];
    return (
      first?.images?.large?.url ||
      first?.images?.medium?.url ||
      first?.images?.original?.url ||
      null
    );
  } catch {
    return null; // fail gracefully if TripAdvisor photo request fails
  }
}

/**
 * Main route handler for GET /restaurants
 * Reads query params:
 *   latitude, longitude (required)
 *   radius (default 10)
 *   radiusUnits (default "mi")
 *   q (optional search term; switches endpoint from nearby → search)
 *
 * Calls TripAdvisor API, attaches photos, and returns JSON { data: [...] }.
 */
async function getRestaurantTripAdvisor(req, res, next) {
  try {
    //Parse query parameters
    const lat = emptyToUndef(req.query.latitude);
    const lon = emptyToUndef(req.query.longitude);
    const radius = emptyToUndef(req.query.radius) || "10";
    const radiusUnit = emptyToUndef(req.query.radiusUnits) || "mi";
    const q = emptyToUndef(req.query.q);
    
    // Endpoint choice:
    //  - with q → /v1/location/search
    //  - without q → /v1/location/nearby_search
    const endpoint = q ? "/v1/location/search" : "/v1/location/nearby_search";

    // Build request params
    const params = new URLSearchParams({
      key: api_key,
      category: "restaurants",
      latLong: `${lat},${lon}`,
      radius,
      radiusUnit,
      ...(q ? { searchQuery: q } : {}), // only include searchQuery if q exists
    });

    // Call TripAdvisor API 
    const { data } = await axios.get(`${base_url}${endpoint}`, {
      headers: { accept: "application/json" },
      params,
    });

    let list = Array.isArray(data?.data) ? data.data : [];

    // Attach photos for first N items 
    // To keep latency down, only decorate the first N results with photo URLs.
    const N = 16;
    const head = list.slice(0, N);
    const tail = list.slice(N);

    const withPhotosHead = await Promise.all(
      head.map(async (item) => {
        // First try TripAdvisor photo API
        let photoUrl = await fetchPrimaryPhoto(item.location_id);
    
        // If TripAdvisor didn’t return anything, fallback to Unsplash
        if (!photoUrl) {
          const category = guessCategory(item.name);
          const seed = item.location_id || item.name;
          photoUrl = await fetchUnsplashImageFor(category, seed, item.name);
        }
    
        return {
          ...item,
          photoUrl,
        };
      })
    );

    // Recombine decorated head + untouched tail
    list = [...withPhotosHead, ...tail];

    // Return data in a consistent format
    return res.json({ data: list });
  } catch (err) {
    // Pass any errors to Express error middleware
    next(err);
  }

   /**
   * Guess a category string based on restaurant name.
   * Used to pick a relevant fallback photo from Unsplash.
   */
  function guessCategory(name) {
    const lower = (name || "").toLowerCase();
    if (lower.includes("pizza")) return "pizza";
    if (lower.includes("burger") || lower.includes("grill")) return "burger";
    if (lower.includes("sushi")) return "sushi";
    if (lower.includes("seafood")) return "seafood";
    if (lower.includes("bakery") || lower.includes("cafe")) return "bakery";
    if (lower.includes("chicken")) return "chicken";
    return "restaurant food"; // generic fallback
  }
}

export { getRestaurantTripAdvisor };
