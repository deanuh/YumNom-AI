// used to validate data being put into the database. 

export function validateUserData(userData) {
	console.log("reached validateUserData");
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

export function validateRatingData(ratingData) {
	const requiredFields = ["user_ratings", "review"];

	for (const field of requiredFields) {
		console.log(ratingData[field]);
		if (ratingData[field] === undefined || ratingData[field] === null) {
			throw new Error(`Missing required field: ${field}`);
		}
	}

	// user_ratings
	console.log(ratingData.user_ratings);
	console.log(typeof ratingData.user_ratings);
	if (!Array.isArray(ratingData.user_ratings)) throw new Error("Invalid format for user_ratings field.");
	if (ratingData.user_ratings.length !== 5) throw new Error("user_ratings must be an array of length 5.");
	ratingData.user_ratings.forEach((val, i) => {
		if (!Number.isInteger(val)) throw new Error(`user_ratings[${i}] is not an integer.`);
		if (!(val == -99 || (val >= 1 && val <= 10))) throw new Error(`Rating is out of range (1, 10) or not -99.`);
	});

	// name
	if (!(typeof ratingData.name === "string")) throw new Error("name is not a string.");

	// review
	if (!(typeof ratingData.review === "string")) throw new Error("review is not a string.");
	if ((ratingData.review.length > 1024)) throw new Error("review cannot exceed 1024 characters."); // arbitrary length


	return true;
}

