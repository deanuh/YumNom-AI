import 'dotenv/config';
import {
	addUser,
	deleteUser,
	addGroup,
	deleteGroup,
	addFavorite, 
	deleteFavorite,
	addRecommendation,
	deleteRecommendation,
	addVote,
	deleteVote
} from '../firebase/dbFunctions.js'

// ------------------- USERS ------------------- //
export async function createUser(req, res) {
  try {
		const userId = req.uid;
    const { first_name, last_name, username } = req.body;
		console.log(`userId: ${userId}, first_name: ${first_name}, last_name: ${last_name}, username: ${username}`);
    if (!userId || !first_name || !last_name || !username) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    await addUser({ first_name, last_name, username }, userId);
    return res.status(201).json({ message: "User created", userId });
  } catch (error) {
		console.error(err.message);
    return res.status(500).json({ error: error.message });
  }
}

export async function removeUser(req, res) {
  try {
    const userId = req.uid;
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
    const userId = req.uid;
    if (!userId) return res.status(400).json({ error: "Missing userId." });

    await deleteGroup(userId);
    return res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ------------------- FAVORITES ------------------- //
export async function createFavorite(req, res) {
  try {
		const userId = req.uid;
    const { api_id, name, photo_url, type } = req.body;
    if (!userId || !api_id || !name || !photo_url || !type) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const favoriteId = await addFavorite({ api_id, name, photo_url, type }, userId);
    return res.status(201).json({ message: "Favorite added", favoriteId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function removeFavorite(req, res) {
  try {
		const userId = req.uid;
    const favoriteId = req.body.favoriteId;
    if (!userId || !favoriteId) {
      return res.status(400).json({ error: "Missing userId or favoriteId." });
    }

    await deleteFavorite(userId, favoriteId);
    return res.status(200).json({ message: "Favorite deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ------------------- RECOMMENDATIONS ------------------- //
export async function createRecommendation(req, res) {
  try {
		const userId = req.uid;
    const { api_id, name, photo_url } = req.body;
    if (!userId || !api_id || !name || !photo_url) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const recommendationId = await addRecommendation({ api_id, name, photo_url }, userId);
    return res.status(201).json({ message: "Recommendation added", recommendationId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function removeRecommendation(req, res) {
  try {
		const userId = req.uid;
    const recommendationId = req.body.recommendationId;
    if (!userId || !recommendationId) {
      return res.status(400).json({ error: "Missing userId or recommendationId." });
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
		const userId = req.uid;
    const { name, photo_url, restaurant_id } = req.body;
    if (!userId || !name || !photo_url || !restaurant_id) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const voteId = await addVote({ name, photo_url, restaurant_id }, userId);
    return res.status(201).json({ message: "Vote added", voteId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function removeVote(req, res) {
  try {
		const userId = req.uid;
    const voteId = req.body.voteId;
    if (!userId || !voteId) {
      return res.status(400).json({ error: "Missing userId or voteId." });
    }

    await deleteVote(userId, voteId);
    return res.status(200).json({ message: "Vote deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

