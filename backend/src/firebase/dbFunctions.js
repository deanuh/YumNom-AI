// dbFunctions.js
import dbModule from "./db.cjs"; 
const { db } = dbModule;
import {
  validateUserData,
  validateVoteData,
  validateFavoriteData,
  validateRecommendationData,
	validateRatingData
} from "./validateData.js";

import { fetchLogoData } from '../api/logo.js';
import admin from "firebase-admin";
const { FieldValue } = admin.firestore;

// -------------------- USERS -------------------- //
export async function addUser(userData, userId) {
  try {
		console.log("reached addUser");
    validateUserData(userData);
		console.log("left validateUserData");

		await db.collection("User").doc(userId).create({
      address: null,
      profile_picture: "ban_gato.png", //placeholder image, change if we have a new one.
      ...userData, 
      email: userData.email || "",
      username_lower: (userData.username || "").toLowerCase(),
      friends: [],
      restriction: {},
      date_created: FieldValue.serverTimestamp(),
      current_group: null
    });

    return userId;
  } catch (err) {
    console.error(`addUser failed: ${err.message}`);
    throw new Error(`addUser failed: ${err.message}`);
  }
}

export async function deleteUser(userId) {

  const userRef = db.collection("User").doc(userId);

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("User does not exist.");

      const userData = userDoc.data();


			// Remove user from group if exists
			if (userData.current_group) {
			  const groupRef = db.collection("Group").doc(userData.current_group);
			  const groupDoc = await transaction.get(groupRef);
			
			  if (!groupDoc.exists) {
			    throw new Error(`Dangling group reference for user: ${userId}`);
			  }
			
			  const groupData = groupDoc.data();
			
			  // Remove user from members
			  delete groupData.members[userId];
			
			  let newOwner = groupData.owner_id;
			
			  // If the deleted user was the owner, pick a new one
			  if (groupData.owner_id === userId) {
			    const memberIds = Object.keys(groupData.members || {});
			    if (memberIds.length > 0) {
			      newOwner = memberIds[0]; // promote the first remaining member
			    } else {
			      // No members left → delete the group entirely
			      transaction.delete(groupRef);
			    }
			  }
			
			  // Update group with new members and possibly new owner
				if (Object.keys(groupData.members).length > 0) {
			  	transaction.update(groupRef, { 
			  	  members: groupData.members,
			  	  owner_id: newOwner
			  	});
				}
			}

			transaction.delete(userRef);

		});


    // Delete subcollections after transaction (cannot be in transaction)
    const subcollections = ["favorites", "ai_recommended_dishes", "ratings"];
    for (const sub of subcollections) {
      const snapshot = await userRef.collection(sub).get();

      for (const doc of snapshot.docs) {
        if (sub === "ratings") {
          const ratingData = doc.data();
          const restaurantRef = db.collection("Rating").doc(doc.id);

          const restaurantDoc = await restaurantRef.get();
          if (restaurantDoc.exists) {
            const restaurantData = restaurantDoc.data();

            // Remove this user's rating from aggregates
            const oldRatings = ratingData.user_ratings ?? [-99, -99, -99, -99, -99];
            const sum_delta = oldRatings.map(r => (r !== -99 ? -r : 0));
            const count_delta = oldRatings.map(r => (r !== -99 ? -1 : 0));

            let new_rating_sum = restaurantData.rating_sum.map((sum, i) => sum + sum_delta[i]);
            let new_user_count = restaurantData.user_count.map((count, i) => count + count_delta[i]);

            // Remove from recent_ratings
            const recents = (restaurantData.recent_ratings || []).filter(
              r => r.user_id !== userId
            );

            const allCountsZero = new_user_count.every(c => c <= 0);

            if (allCountsZero) {
              await restaurantRef.delete();
            } else {
              await restaurantRef.update({
                rating_sum: new_rating_sum,
                user_count: new_user_count,
                recent_ratings: recents
              });
            }
          }
        }

        // Delete the document itself
        await doc.ref.delete();
      }
    }
  } catch (err) {
    console.error(`deleteUser failed: ${err.message}`);
    throw new Error(`deleteUser failed: ${err.message}`);
  }
}

// -------------------- GROUPS -------------------- //
export async function addGroup(userId) {
  let newGroupId;

  try {
		
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection("User").doc(userId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("User does not exist.");

      const userData = userDoc.data();
      if (userData.current_group) {
        throw new Error("User already in a group.");
      }

      const groupRef = db.collection("Group").doc();
      newGroupId = groupRef.id;

      transaction.set(groupRef, {
        members: {
          [userId]: {
            profile_picture: userData.profile_picture || null,
            username: userData.username || "Unknown"
          }
        },
        owner_id: userId,
        date_created: FieldValue.serverTimestamp(),
        secondsUntilExpiration: 300// offset in seconds, saved as int
      });

      transaction.update(userRef, {
        current_group: groupRef.id
      });
    });

    return newGroupId;
  } catch (err) {
    console.error(`addGroup failed: ${err.message}`);
    throw new Error(`addGroup failed: ${err.message}`);
  }
}

export async function deleteGroup(userId) {

  try {
		
		const userDoc = await db.collection("User").doc(userId).get();

		if (!userDoc.exists) throw new Error("User does not exist");

		const userData = userDoc.data();
		const groupId = userData.current_group;
  	const groupRef = db.collection("Group").doc(groupId);
    await db.runTransaction(async (transaction) => {
      const groupDoc = await transaction.get(groupRef);
      if (!groupDoc.exists) throw new Error("Group does not exist.");

      const groupData = groupDoc.data();
      const userIds = Object.keys(groupData.members || {});

      // Clear current_group for all members
      for (const memberId of userIds) {
        const userRef = db.collection("User").doc(memberId);
        transaction.update(userRef, { current_group: null });
      }

      transaction.delete(groupRef);
    });

    // Delete subcollections (votes)
    const votesSnapshot = await groupRef.collection("votes").get();
    for (const voteDoc of votesSnapshot.docs) {
      await voteDoc.ref.delete();
    }
  } catch (err) {
    console.error(`deleteGroup failed: ${err.message}`);
    throw new Error(`deleteGroup failed: ${err.message}`);
  }
}

export async function getGroupFromUserId(userId) {
	try {
		const userRef = db.collection("User").doc(userId);
		const userDoc = await userRef.get();
		if (!userDoc.exists) throw new Error("User does not exist"); 
		const userData = userDoc.data();

		const groupId = userData.current_group;
		if (!groupId) return null;

		const groupRef = db.collection("Group").doc(groupId);
		const groupDoc = await groupRef.get();
		if (!groupDoc.exists) throw new Error("Dangling group reference");
		const groupData = groupDoc.data();
		groupData.id = groupDoc.id; //append id to data
		return groupData;

	} catch(err) {
		console.error(`getGroupFromUserId failed: ${err.message}`);
		throw new Error(`getGroupFromUserId failed: ${err.message}`);
	}
}

export async function getGroupFromGroupId(groupId) {
	try {
		const groupRef = db.collection("Group").doc(groupId);
		const groupDoc = await groupRef.get();
		if (!groupDoc.exists) throw new Error("Group does not exist.");
		const groupData = groupDoc.data();
		groupData.id = groupDoc.id; //append id to data
		return groupData;

	} catch(err) {
		console.error(`getGroupFromGroupId failed: ${err.message}`);
		throw new Error(`getGroupFromGrupId failed: ${err.message}`);
	}
}

// -------------------- FAVORITES -------------------- //

// Add a new favorite for the authenticated User
// Validates required fields coming from favoriteData
// Verifies that the parent user doc exists
export async function addFavorite(favoriteData, userId) {
  try {
    validateFavoriteData(favoriteData);

    const userRef = db.collection("User").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User does not exist.");

    // Create a new favorite doc with server-side timestamps
    const favRef = await userRef.collection("favorites").add({
      ...favoriteData,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    return favRef.id;
  } catch (err) {
    console.error(`addFavorite failed: ${err.message}`);
    throw new Error(`addFavorite failed: ${err.message}`);
  }
}

// Delete an Existing Favorite for the authenticated User
// Checks that both User and Favorite documents exist before deletion
// Looks up specific favorite document under that user
// Deletes the favorite document if found
export async function deleteFavorite(userId, favoriteId) {
  try {
    const userRef = db.collection("User").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User does not exist.");

    const favRef = userRef.collection("favorites").doc(favoriteId);
    const favDoc = await favRef.get();
    if (!favDoc.exists) throw new Error("Favorite does not exist.");

    await favRef.delete();
    return true;
  } catch (err) {
    console.error(`deleteFavorite failed: ${err.message}`);
    throw new Error(`deleteFavorite failed: ${err.message}`);
  }
}

// List Favorites for the authenticated User with optional filtering and pagination
// Confirms the user doc exists
// Builds a firestore query on the user's favorites subcollection
// Applies an optional type filter 
// Enforces a safe maximum limit on page size
// Supports cursor-based pagination by accepting a document id and starting after it
export async function getFavorites(
  userId,
  { type, limit = 20, cursorDocId } = {}
) {
  try {
    const userRef = db.collection("User").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User does not exist.");

    // Base query: user's favorites, newest first
    let q = userRef.collection("favorites").orderBy("created_at", "desc");

    // Optional: Users favorites, newest first
    if (type) q = q.where("type", "==", type);
    // Enforece a max page size to keep queries performant
    const capped = Math.min(limit || 20, 100);
    q = q.limit(capped);

    // Cursor-based pagination: start after a known document id if provided
    if (cursorDocId) {
      const cursorSnap = await userRef.collection("favorites").doc(cursorDocId).get();
      if (!cursorSnap.exists) throw new Error("Invalid cursor.");
      q = q.startAfter(cursorSnap);
    }

    // Execute query and shape the response
    const snap = await q.get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.size === capped ? snap.docs[snap.docs.length - 1].id : null;

    return { items, nextCursor };
  } catch (err) {
    console.error(`getFavorites failed: ${err.message}`);
    throw new Error(`getFavorites failed: ${err.message}`);
  }
}
// -------------------- AI RECOMMENDATIONS -------------------- //
export async function addRecommendation(recommendationData, userId) {
  try {

    validateRecommendationData(recommendationData);

    const userRef = db.collection("User").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User does not exist.");

    const ratingRef = await userRef.collection("ai_recommended_dishes").add(recommendationData);
    return ratingRef.id;
  } catch (err) {
    console.error(`addRecommendation failed: ${err.message}`);
    throw new Error(`addRecommendation failed: ${err.message}`);
  }
}

export async function deleteRecommendation(userId, recommendationId) {
  try {
    const userRef = db.collection("User").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User does not exist.");

    const ratingRef = userRef.collection("ai_recommended_dishes").doc(recommendationId);
    const recDoc = await ratingRef.get();
    if (!recDoc.exists) throw new Error("Recommendation does not exist.");

    await ratingRef.delete();
  } catch (err) {
    console.error(`deleteRecommendation failed: ${err.message}`);
    throw new Error(`deleteRecommendation failed: ${err.message}`);
  }
}

// -------------------- VOTES -------------------- //
export async function addVote(voteData, userId) {
	//maybe use only to add a new restaurant to poll
	//then use seperate function to increment and decrement tally by 1
	//might need rewrite 
  try {
		const userDoc = await db.collection("User").doc(userId).get();

		if (!userDoc.exists) throw new Error("User does not exist");

		const userData = userDoc.data();
		const groupId = userData.current_group;

    validateVoteData(voteData);

    const groupRef = db.collection("Group").doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error("Group does not exist.");

    const voteRef = await groupRef.collection("votes").add({
      ...voteData,
			recommended_by: userId,
			voted_by: [userId],
      added_at: FieldValue.serverTimestamp()
    });

    return voteRef.id;
  } catch (err) {
    console.error(`addVote failed: ${err.message}`);
    throw new Error(`addVote failed: ${err.message}`);
  }
}

export async function deleteVote(userId, voteId) {
  try {
		const userDoc = await db.collection("User").doc(userId).get();

		if (!userDoc.exists) throw new Error("User does not exist");

		const userData = userDoc.data();
		const groupId = userData.current_group;

    const groupRef = db.collection("Group").doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error("Group does not exist.");

    const voteRef = groupRef.collection("votes").doc(voteId);
    const voteDoc = await voteRef.get();
    if (!voteDoc.exists) throw new Error("Vote does not exist.");

    await voteRef.delete();
  } catch (err) {
    console.error(`deleteVote failed: ${err.message}`);
    throw new Error(`deleteVote failed: ${err.message}`);
  }
}

// ---------- PREFERENCES ----------

/**
 * Upsert (insert or update) user preferences.
 * - Normalizes input (lowercase, dedupe, sort)
 */

export async function upsertPreferences(userId, { likes = [], restrictions = [] }) {
  try {
    const userRef = db.collection("User").doc(userId);
    const snap = await userRef.get();
    if (!snap.exists) throw new Error("User does not exist.");

    // normalize/dedupe/sort
    const norm = (arr) =>
      Array.from(new Set((arr || []).map(s => String(s).toLowerCase().trim()))).sort();

    await userRef.set(
      {
        likes: norm(likes),
        restrictions: norm(restrictions),
        prefs_updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error(`upsertPreferences failed: ${err.message}`);
    throw new Error(`upsertPreferences failed: ${err.message}`);
  }
}

/**
 * Fetch user preferences (likes, restrictions).
 */

export async function getPreferences(userId) {
  try {
    const userRef = db.collection("User").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error("User does not exist.");
    const data = doc.data() || {};
    return {
      likes: Array.isArray(data.likes) ? data.likes : [],
      restrictions: Array.isArray(data.restrictions) ? data.restrictions : [],
      prefs_updated_at: data.prefs_updated_at || null,
    };
  } catch (err) {
    console.error(`getPreferences failed: ${err.message}`);
    throw new Error(`getPreferences failed: ${err.message}`);
  }
}
// ---------------- REVIEW -----------------------


export async function addRating(ratingData, userId) {
  try {
    validateRatingData(ratingData);

    const userRef = db.collection("User").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User does not exist.");

    const ratingRef = userRef.collection("ratings").doc(ratingData.api_id);
    const ratingDoc = await ratingRef.get();

    let oldUserRatings = [-99, -99, -99, -99, -99];

    if (ratingDoc.exists) {
      const oldRatingData = ratingDoc.data();
      oldUserRatings = oldRatingData.user_ratings ?? oldUserRatings;
    }

    const newRatings = ratingData.user_ratings;
    const oldRatings = oldUserRatings;

    // Compute deltas
    const sum_delta = newRatings.map((val, i) => {
      if (oldRatings[i] === -99 && val !== -99) return val;
      if (oldRatings[i] !== -99 && val === -99) return -oldRatings[i];
      if (oldRatings[i] !== -99 && val !== -99) return val - oldRatings[i];
      return 0;
    });

    const count_delta = newRatings.map((val, i) => {
      if (oldRatings[i] === -99 && val !== -99) return 1;
      if (oldRatings[i] !== -99 && val === -99) return -1;
      return 0;
    });

    // Write the user’s rating immediately (this is independent of aggregates)
    await ratingRef.set({
      user_ratings: newRatings,
      review: ratingData.review
    });

    // Transaction protects restaurant aggregate fields
    const restaurantRef = db.collection("Rating").doc(ratingData.api_id);

    await db.runTransaction(async (transaction) => {
      const restaurantDoc = await transaction.get(restaurantRef);
			const userData = userDoc.data();
			const newEntry = {
						user_id: userId,
						username: userData.username,
						profile_picture: userData.profile_picture,
						user_ratings: ratingData.user_ratings,
						review: ratingData.review
			}

      if (!restaurantDoc.exists) {
        const logoData = await fetchLogoData(ratingData.name);
        const logo_url = logoData?.logo_url || "";

        transaction.set(restaurantRef, {
          name: ratingData.name,
          logo_url,
          rating_sum: sum_delta,
          user_count: count_delta,
					recent_ratings: [newEntry]
        });
        return;
      }

			const restaurantData = restaurantDoc.data();
			
			// Update rating sums and counts
			const new_rating_sum = restaurantData.rating_sum.map((sum, i) => sum + sum_delta[i]);
			const new_user_count = restaurantData.user_count.map((count, i) => count + count_delta[i]);
			
			// Update recent_ratings: replace existing entry for this user if present
			let recents = restaurantData.recent_ratings;
			
			// Remove any existing entry for this user
			recents = recents.filter(r => r.user_id !== userId);
			
			// Add new entry at the front
			recents.unshift(newEntry);
			
			// Keep only latest 5
			if (recents.length > 5) recents.pop();
			
			transaction.update(restaurantRef, {
			  rating_sum: new_rating_sum,
			  user_count: new_user_count,
			  recent_ratings: recents
			});
		});

    return ratingRef.id;

  } catch (err) {
    console.error(`addRating failed: ${err.message}`);
    throw new Error(`addRating failed: ${err.message}`);
  }
}

export async function deleteRating(userId, restaurantId) {
  try {
    const userRef = db.collection("User").doc(userId);
    const ratingRef = userRef.collection("ratings").doc(restaurantId);
    const ratingDoc = await ratingRef.get();

    if (!ratingDoc.exists) throw new Error("Rating does not exist.");

    const ratingData = ratingDoc.data();
    const oldRatings = ratingData.user_ratings ?? [-99, -99, -99, -99, -99];

    // Compute deltas for aggregate removal
    const sum_delta = oldRatings.map(r => (r !== -99 ? -r : 0));
    const count_delta = oldRatings.map(r => (r !== -99 ? -1 : 0));

    // Delete user's rating first
    await ratingRef.delete();

    const restaurantRef = db.collection("Rating").doc(restaurantId);

    await db.runTransaction(async (transaction) => {
      const restaurantDoc = await transaction.get(restaurantRef);
      if (!restaurantDoc.exists) return;

      const restaurantData = restaurantDoc.data();

      // Update rating_sum and user_count
      const new_rating_sum = restaurantData.rating_sum.map((sum, i) => sum + sum_delta[i]);
      const new_user_count = restaurantData.user_count.map((count, i) => count + count_delta[i]);

      // Remove this user's entry from recent_ratings
      const recents = (restaurantData.recent_ratings || []).filter(
        r => r.user_id !== userId
      );

      // Delete restaurant if all counts are zero
      const allCountsZero = new_user_count.every(c => c <= 0);

      if (allCountsZero) {
        transaction.delete(restaurantRef);
      } else {
        transaction.update(restaurantRef, {
          rating_sum: new_rating_sum,
          user_count: new_user_count,
          recent_ratings: recents
        });
      }
    });

    return true;
  } catch (err) {
    console.error(`deleteRating failed: ${err.message}`);
    throw new Error(`deleteRating failed: ${err.message}`);
  }
}



export async function getRatings(userId) {
  try {
    const userRef = db.collection("User").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User does not exist.");

		const ratingRef = userRef.collection("ratings");
		const ratingSnapshot = await ratingRef.get();
		return ratingSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		}));
	} catch (err) {
    console.error(`getRatings failed: ${err.message}`);
    throw new Error(`getRatings failed: ${err.message}`);
  }
}


export async function getRatingsForRestaurant(restaurantId, restaurantData) {
  try {
    const restaurantRef = db.collection("Rating").doc(restaurantId);
    const restaurantDoc = await restaurantRef.get();

    if (!restaurantDoc.exists) {
      const logoData = await fetchLogoData(restaurantData.name);
      const logo_url = logoData?.logo_url || "";

      const emptyData = {
        name: restaurantData.name,
        logo_url,
        rating_sum: [0, 0, 0, 0, 0],
        user_count: [0, 0, 0, 0, 0],
				recent_ratings: []
      };

      await restaurantRef.set(emptyData);
      return emptyData;
    }

    const data = restaurantDoc.data();

    const average = data.rating_sum.map((sum, i) => {
      const count = data.user_count[i];
      return count > 0 ? sum / count : null; // null instead of 0 means “no rating”
    });

    return {
      id: restaurantDoc.id,
      ...data,
      average: average.map(a => (a !== null ? Math.round(a) : null)),   // computed here, not stored
    };

  } catch (err) {
    console.error(`getRatingsForRestaurant failed: ${err.message}`);
    throw new Error(`getRatingsForRestaurant failed: ${err.message}`);
  }
}

// --- PROFILE (basic) ---
export async function getUserBasic(userId) {
  const ref = db.collection("User").doc(userId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("User does not exist.");
  const d = snap.data() || {};
  return {
    username: d.username || "",
    first_name: d.first_name || "",
    last_name: d.last_name || "",
    profile_picture: d.profile_picture || "",
    diet: d.diet || { types: [], allergens: [] },
    exclusions: d.exclusions || { ingredients: [], items: [] },
  };
}
// Creates the User/{uid} doc if missing, or merges provided fields.
// Returns the full document after upsert.
export async function ensureUserBasic(userId, defaults = {}) {
  const ref = db.collection("User").doc(userId);
  const snap = await ref.get();

  // sensible defaults if caller didn't pass any
  const base = {
    username: "",
    username_lower: "",
    first_name: "",
    last_name: "",
    profile_picture: "",
    date_created: new Date().toISOString(),
    diet: { types: [], allergens: [] },
    exclusions: { ingredients: [], items: [] },
  };

  // if it exists, just merge; if not, set base + defaults
  // if exists, don't override username
  let payload;
  if (snap.exists) {
    payload = { ...defaults };
    delete payload.username; // prevent overwriting username if doc exists
  } else {
    payload = { ...base, ...defaults };
  }
  await ref.set(payload, { merge: true });

  return (await ref.get()).data();
}


export async function updateUserBasic(
  userId,
  { username, first_name, last_name, profile_picture, diet, exclusions }
) {
  const ref = db.collection("User").doc(userId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("User does not exist.");

  const payload = {};
  if (typeof username === "string") payload.username_lower = username.toLowerCase();
  if (typeof first_name === "string") payload.first_name = first_name;
  if (typeof last_name === "string") payload.last_name = last_name;
  if (typeof profile_picture === "string") payload.profile_picture = profile_picture;

  // merge structured preferences safely
  if (diet && typeof diet === "object") {
    const curr = snap.data().diet || {};
    payload.diet = {
      types: Array.isArray(diet.types) ? diet.types : (curr.types || []),
      allergens: Array.isArray(diet.allergens) ? diet.allergens : (curr.allergens || []),
    };
  }

  if (exclusions && typeof exclusions === "object") {
    const curr = snap.data().exclusions || {};
    payload.exclusions = {
      ingredients: Array.isArray(exclusions.ingredients) ? exclusions.ingredients : (curr.ingredients || []),
      items: Array.isArray(exclusions.items) ? exclusions.items : (curr.items || []),
    };
  }

  await ref.set(payload, { merge: true });
  return true;
}

// -------------------- GROUP INVITES -------------------- //

export async function addUserToGroup(userId, groupId) {
  const userRef = db.collection("User").doc(userId);
  const groupRef = db.collection("Group").doc(groupId);

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const groupDoc = await transaction.get(groupRef);

      if (!userDoc.exists) throw new Error("User does not exist.");
      if (!groupDoc.exists) throw new Error("Group does not exist.");

      const userData = userDoc.data();
      const groupData = groupDoc.data();

      // Add user to the group's members map
      const newMembers = {
        ...groupData.members,
        [userId]: {
          profile_picture: userData.profile_picture || "ban_gato.png",
          username: userData.username || "New Member"
        }
      };

      transaction.update(groupRef, { members: newMembers });
      transaction.update(userRef, { current_group: groupId });
    });
    return true;
  } catch (err) {
    console.error(`addUserToGroup failed: ${err.message}`);
    throw new Error(`addUserToGroup failed: ${err.message}`);
  }
}
