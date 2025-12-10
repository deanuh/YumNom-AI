import "dotenv/config";
import {
  addUser,
  deleteUser,
  addGroup,
  deleteGroup,
  getFavorites,
  addFavorite,
  deleteFavorite,
  addRecommendation,
  deleteRecommendation,
  addVote,
  deleteVote,
  upsertPreferences,
  getPreferences as getPrefsFromDb,
	addRating,
	deleteRating,
	getRatings,
	getRatingsForRestaurant,
  addUserToGroup
} from "../firebase/dbFunctions.js";
import { fetchTAPlaceDetails, fetchRestaurantTANoUnsplash } from '../api/tripadvisor.js'
import { fetchRestaurantFatSecret } from '../api/fatsecret.js'
import { fetchLogoData } from '../api/logo.js'

// ------------------- USERS ------------------- //
export async function createUser(req, res) {
  try {
    const userId = req.uid; // <-- from authMiddleware
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { first_name, last_name, username } = req.body;
    if (!first_name || !last_name || !username) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const id = await addUser({ first_name, last_name, username }, userId);
    return res.status(201).json({ message: "User created", userId: id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function removeUser(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId." });

    await deleteUser(userId);
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ------------------- GROUPS ------------------- //
export async function createGroup(req, res) {
  try {
    const userId = req.uid;
    if (!userId) return res.status(400).json({ error: "Missing userId." });

    const groupId = await addGroup(userId);
    return res.status(201).json({ message: "Group created", groupId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function removeGroup(req, res) {
  try {
    const { groupId } = req.params;
    if (!groupId) return res.status(400).json({ error: "Missing groupId." });

    await deleteGroup(groupId);
    return res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ------------------- FAVORITES ------------------- //

// Add a new favorite for the authenitcated User
// Reads the authed users UID from req.uid (set by authMiddleware)
// Validates required fields coming from the request body
// Calls addFavorite from dbFunctions.js to add the favorite to Firestore
// Returns 201 status with favoriteId on success, or 500 status with error message on failure
export async function createFavorite(req, res) {
  try {
    const userId = req.uid;
    const { api_id, name, photo_url, type } = req.body;
    if (!userId || !api_id || !name || !photo_url || !type) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const favoriteId = await addFavorite(
      { api_id, name, photo_url, type },
      userId
    );
    return res.status(201).json({ message: "Favorite added", favoriteId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Delete an Existing Favorite for the authenticated User
// Reads the authed user UID from req.uid (set by authMiddleware)
// Calls data layer to remove the document at User's favorites subcollection
// Returns 200 status with success message on success, or 500 status with error message on failure
export async function removeFavorite(req, res) {
  try {
    const userId = req.uid; // set by authMiddleware
    const favoriteId = req.params.favoriteId || req.body.favoriteId;
    if (!userId || !favoriteId) {
      return res.status(400).json({ error: "Missing userId or favoriteId." });
    }

    await deleteFavorite(userId, favoriteId);
    return res.status(200).json({ message: "Favorite deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// List Favorites for the authenticated User with optional filtering and pagination
// Requires req.uid to identify the user (set by authMiddleware)
// Supports optional filtereing by type
// Supports pagination via limit and cursor query parameters
// Caps the page size to a safe maximum
// Calls getFavorites from dbFunctions.js to fetch the data from Firestore
// Returns 200 status with list of favorites and nextCursor on success, or 500 status with error message on failure
export async function listFavorites(req, res) {
  try {
    const userId = req.uid; // set by authMiddleware
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { type, limit, cursor } = req.query;
    const lim = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;

    const result = await getFavorites(userId, {
      type: type || undefined,
      limit: lim,
      cursorDocId: cursor || undefined,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("listFavorites failed:", error);
    return res.status(500).json({ error: error.message });
  }
}
// ------------------- RECOMMENDATIONS ------------------- //
export async function createRecommendation(req, res) {
  try {
    const { userId, api_id, name, photo_url } = req.body;
    if (!userId || !api_id || !name || !photo_url) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const recommendationId = await addRecommendation(userId, {
      api_id,
      name,
      photo_url,
    });
    return res
      .status(201)
      .json({ message: "Recommendation added", recommendationId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function removeRecommendation(req, res) {
  try {
    const { userId, recommendationId } = req.params;
    if (!userId || !recommendationId) {
      return res
        .status(400)
        .json({ error: "Missing userId or recommendationId." });
    }

    await deleteRecommendation(userId, recommendationId);
    return res.status(200).json({ message: "Recommendation deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ------------------- VOTES ------------------- //
export async function createVote(req, res) {
  try {
    const { groupId, userId, name, photo_url, restaurant_id } = req.body;
    if (!groupId || !userId || !name || !photo_url || !restaurant_id) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const voteId = await addVote(groupId, userId, {
      name,
      photo_url,
      restaurant_id,
    });
    return res.status(201).json({ message: "Vote added", voteId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function removeVote(req, res) {
  try {
    const { groupId, voteId } = req.params;
    if (!groupId || !voteId) {
      return res.status(400).json({ error: "Missing groupId or voteId." });
    }

    await deleteVote(groupId, voteId);
    return res.status(200).json({ message: "Vote deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ---------- PREFERENCES API ----------

/**
 * Save user preferences
 * - Requires req.uid
 * - Updates likes and restrictions
 */

export async function savePreferences(req, res) {
  try {
    const userId = req.uid; // from authMiddleware
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { likes = [], restrictions = [] } = req.body || {};
    await upsertPreferences(userId, { likes, restrictions });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Read user preferences
 * - Requires req.uid
 */

export async function readPreferences(req, res) {
  try {
    const userId = req.uid; // from authMiddleware
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const prefs = await getPrefsFromDb(userId);
    return res.status(200).json(prefs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ---------- REVIEWS API ----------------

/**
 * match name from restaurants on tripadvisor or fatsecret as a backup
 * -Requires auth for createRating
 *  Retrieves information for restaurants and users.
 */

export async function matchRestaurant(req, res, next) {
  try {
    const exact_match = req.query.q?.trim();
    if (!exact_match)
      return res.status(400).json({ error: "Missing query parameter 'q'" });

    const restaurantInfo = await fetchRestaurantTANoUnsplash(exact_match);
		let restaurantList = []
    if (!restaurantInfo?.length) {
			restaurantList = await fetchRestaurantFatSecret(exact_match);
		} else {
    	restaurantList = restaurantInfo
    	  .filter(r => r?.name)
    	  .map(r => r.name);
		}

    if (!restaurantList.length)
      return res.status(404).json({ error: "Restaurant not found" });

    const hasMatch = restaurantList.some(
      name => name.toLowerCase() === exact_match.toLowerCase()
    );

    if (!hasMatch)
      return res.status(404).json({ error: "Restaurant not found" });

    // normalize name → DB-safe restaurant ID
		
    req.api_id = exact_match.toLowerCase().replace(/\s+/g, "_");
		req.name = exact_match;

    return next();

  } catch (error) {
    console.error("matchRestaurant error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function createRating(req, res) {
  try {
		const userId = req.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const api_id = req.api_id;
		if (!api_id) return res.status(400).json({error: "Missing apiId"});
    const { user_ratings, review } = req.body;

		const name = req.name;
		if (!name) return res.status(400).json({error: "Missing name."});

    if ( user_ratings == null ) {
      return res.status(400).json({ error: "Missing user_ratings." });
    }
		

    const ratingId = await addRating({ api_id, name, user_ratings, review }, userId);
    return res.status(201).json({ message: "Rating added", ratingId });
  } catch (error) {
		console.error(`createRating error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
}


export async function removeRating(req, res) {
  try {
    const userId = req.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { ratingId } = req.params;
    if (!ratingId) return res.status(400).json({ error: "Missing ratingId." });

    await deleteRating(userId, ratingId);
    return res.status(200).json({ message: "Rating deleted" });

  } catch (error) {
    console.error("removeRating error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function readRatings(req, res) {
  try {
    const userId = req.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const ratings = await getRatings(userId);
    return res.status(200).json(ratings);

  } catch (error) {
    console.error("readRatings error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function readRestaurantRatings(req, res) {
	try {
		const apiId = req.api_id;
		const restaurantData = {
			name: req.name,
		};
		if (!apiId) return res.status(400).json({error: "Missing apiId"});

		const ratings = await getRatingsForRestaurant(apiId, restaurantData);
		return res.status(200).json(ratings);

	} catch (error) {
    return res.status(500).json({ error: error.message });
	}
}
