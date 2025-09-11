import axios from "axios";

const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

// search Unsplash for a category photo
export async function fetchUnsplashImage(query) {
  if (!unsplashKey) {
    console.error("Missing UNSPLASH_ACCESS_KEY in .env");
    return null;
  }

  try {
    const { data } = await axios.get("https://api.unsplash.com/search/photos", {
      params: { query, per_page: 1, orientation: "squarish" },
      headers: { Authorization: `Client-ID ${unsplashKey}` },
    });

    return data?.results?.[0]?.urls?.regular || null;
  } catch (err) {
    console.error("Unsplash API error:", err.response?.data || err.message);
    return null;
  }
}
