// this is the code to search for a restaurant when entering a restaurant into the search bar.
//
import axios from "axios";
// Backend URL is injected via environment variable
const base_url = process.env.REACT_APP_BACKEND_URL;

/**
 * getRestaurant
 * Fetches restaurants from backend given location + query.
 *
 * Params:
 *  - longitude: number/string → user longitude
 *  - latitude: number/string → user latitude
 *  - radius: number/string → search radius
 *  - radiusUnits: string → "mi" or "km"
 *  - q: string → optional search query (name, cuisine, etc.)
 *
 * Returns:
 *  - Axios response.data from backend (TripAdvisor API data)
 */
export const getRestaurant = async (
	longitude = "",
	latitude = "",
	radius = "",
	radiusUnits = "",
	q = ""
  ) => {
	try {
	  const options = {
		url: base_url + "/restaurant",
		params: {
			// Only include location params if all are provided
		  ...(latitude && longitude && radius && radiusUnits
			? { latitude, longitude, radius, radiusUnits }
			: {}),
			 // Include query param if provided
		  ...(q ? { q } : {}),
		},
	  };
	  const response = await axios(options);
	  return response.data;
	} catch (err) {
	// Log error (frontend swallows silently; RestaurantSearch shows generic error message)
	  console.log(err);
	}
  };
  