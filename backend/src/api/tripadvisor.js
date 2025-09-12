// tripadvisor.js
import axios from "axios";
import "dotenv/config";
import { fetchUnsplashImageFor } from "./unsplash.js";

const api_key = process.env.TRIPADVISOR_API_KEY;
const base_url = "https://api.content.tripadvisor.com/api";
const emptyToUndef = (v) => (v && String(v).trim() !== "" ? v : undefined);

// helper: fetch ONE primary photo url for a location
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
    return null;
  }
}

async function getRestaurantTripAdvisor(req, res, next) {
  try {
    const lat = emptyToUndef(req.query.latitude);
    const lon = emptyToUndef(req.query.longitude);
    const radius = emptyToUndef(req.query.radius) || "10";
    const radiusUnit = emptyToUndef(req.query.radiusUnits) || "mi";
    const q = emptyToUndef(req.query.q);

    const endpoint = q ? "/v1/location/search" : "/v1/location/nearby_search";

    const params = new URLSearchParams({
      key: api_key,
      category: "restaurants",
      latLong: `${lat},${lon}`,
      radius,
      radiusUnit,
      ...(q ? { searchQuery: q } : {}),
    });

    const { data } = await axios.get(`${base_url}${endpoint}`, {
      headers: { accept: "application/json" },
      params,
    });

    let list = Array.isArray(data?.data) ? data.data : [];

    // fetch a photo for the first N items to keep it fast
    const N = 16;
    const head = list.slice(0, N);
    const tail = list.slice(N);

    const withPhotosHead = await Promise.all(
      head.map(async (item) => {
        // First try TripAdvisor photo
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

    list = [...withPhotosHead, ...tail];

    return res.json({ data: list });
  } catch (err) {
    next(err);
  }
  function guessCategory(name) {
    const lower = (name || "").toLowerCase();
    if (lower.includes("pizza")) return "pizza";
    if (lower.includes("burger") || lower.includes("grill")) return "burger";
    if (lower.includes("sushi")) return "sushi";
    if (lower.includes("seafood")) return "seafood";
    if (lower.includes("bakery") || lower.includes("cafe")) return "bakery";
    if (lower.includes("chicken")) return "chicken";
    return "restaurant food";
  }
}

export { getRestaurantTripAdvisor };
