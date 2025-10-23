// dbFunctions.js
import dbModule from "./db.cjs"; 
const { db } = dbModule;
import {
  validateUserData,
  validateVoteData,
  validateFavoriteData,
  validateRecommendationData
} from "./validateData.js";

import admin from "firebase-admin";
const { FieldValue } = admin.firestore;

// -------------------- USERS -------------------- //

// By Wissam for addUser: creates User and sets default fields
export async function addUser(userData, userId) {
  try {
		console.log("reached addUser");
    validateUserData(userData);
		console.log("left validateUserData");

		await db.collection("User").doc(userId).create({
      address: null,
      profile_picture: null,
      ...userData,
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
    const subcollections = ["favorites", "ai_recommended_dishes"];
    for (const sub of subcollections) {
      const snapshot = await userRef.collection(sub).get();
      for (const doc of snapshot.docs) {
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
        session_expires_at: FieldValue.serverTimestamp() // adjust for real session expiration
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
export async function getGroup(userId) {
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
		console.error(`getGroup failed: ${err.message}`);
		throw new Error(`getGroup failed: ${err.message}`);
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

    const recRef = await userRef.collection("ai_recommended_dishes").add(recommendationData);
    return recRef.id;
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

    const recRef = userRef.collection("ai_recommended_dishes").doc(recommendationId);
    const recDoc = await recRef.get();
    if (!recDoc.exists) throw new Error("Recommendation does not exist.");

    await recRef.delete();
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

