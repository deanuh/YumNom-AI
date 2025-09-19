import express from 'express';
import axios from 'axios';
import 'dotenv/config';

const oauth2url = 'https://oauth.fatsecret.com/connect/token';
const base_url = 'https://platform.fatsecret.com/rest';
const fatsecret_client_id = process.env.FATSECRET_CLIENT_ID
const fatsecret_client_secret = process.env.FATSECRET_CLIENT_SECRET


//Helper function for retrieving OAuth2 token for API calls.

async function getAuthTokenFatSecret() {
	if (expirationDate > Date.now()) {
		console.log('token still valid...');
		return accessToken;
	}

	var options = {
	   method: 'POST',
	   url: oauth2url,
	   auth: {
	      username : process.env.FATSECRET_CLIENT_ID,
	      password : process.env.FATSECRET_CLIENT_SECRET
	   },
	   headers: { 'content-type': 'application/x-www-form-urlencoded'},
	   data: new URLSearchParams({
	      'grant_type': 'client_credentials',
	      'scope' : 'premier'
	   }),
	};
	
	const response = await axios(options);
	
	accessToken = response.data.access_token;
	expirationDate = Date.now() + (response.data.expires_in * 1000)
	return accessToken; 
};

async function getRestaurantFatSecret(req, res, next) {

	const token = await getAuthTokenFatSecret();

	var options = {
		method: "GET",
		url: base_url + '/brands/v2',
		headers: {
			'Authorization': `Bearer ${token}`
		},
		params: {
			starts_with: "McDonald", // replace after router is finished, pass user query
			brand_type: "restaurant", // through here.
			format: "json"
		},
	};

	const response = await axios(options);
	return res.json(response.data);

}

// Use this to retrieve the id of the food item from FatSecret.
// Useful for allergen information and other details.
// Technically could be used to retrieve a restaurant's menu, as well.
async function getFoodFatSecret(req, res, next) {
	const token = await getAuthTokenFatSecret();

	var options = {
		method: "GET",
		url: base_url + '/foods/search/v3',
		headers: {
			'Authorization': `Bearer ${token}`
		},
		params:{
			search_expression: "McDonald's", //  If this is used to retrieve a menu, pass the brand name here. 
			max_results: 20,
			include_sub_categories: true, 	 //  However, the API wasn't meant for that.
			include_food_images: true,
			include_food_attributes: true,
			format: "json"
		},
	};
	const response = await axios(options);
	return res.json(response.data);
}

export {getRestaurantFatSecret, getFoodFatSecret};
