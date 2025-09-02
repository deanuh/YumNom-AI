export function validateUserData(userData) {
	const requiredFields = ["first_name", "last_name", "username"];
	for (const field of requiredFields) {
		if (!userData[field]) {
			throw new Error(`Missing required field: ${field}`);
		}
	}
	return true;
}

export function validateFavoriteData(favoriteData) {
	const requiredFields = ["api_id", "name", "photo_url", "type"];

	for (const field of requiredFields) {
		if (!favoriteData[field]) {
			throw new Error(`Missing required field: ${field}`);
		}
	}
	return true;
}
export function validateRecommendationData(recommendationData) {
	const requiredFields = ["api_id", "name", "photo_url"];
      	for (const field of requiredFields) {
		if (!recommendationData[field]) {
			throw new Error(`Missing required field: ${field}`);
		}
	}
	return true;
}
export function validateVoteData(voteData) {
	const requiredFields = ["name","photo_url", "restaurant_id"];
	for (const field of requiredFields) {
		if (!voteData[field]) {
			throw new Error(`Missing required field: ${field}`);
		}
	}
	return true;
}

