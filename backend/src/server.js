import express from 'express';
import axios from 'axios';
import 'dotenv/config';

let app = express();

let accessToken = null;
let expirationDate = Date.now();

async function getAuthToken() {
	if (expirationDate > Date.now()) {
		console.log('token still valid...');
		return accessToken;
	}

	var options = {
	   method: 'POST',
	   url: 'https://oauth.fatsecret.com/connect/token',
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

async function getRestaurant(req, res, next) {

	const token = await getAuthToken();

	var options = {
		method: "GET",
		url: "https://platform.fatsecret.com/rest/brands/v2",
		headers: {
			'Authorization': `Bearer ${token}`
		},
		params: new URLSearchParams({
			starts_with: "McDonald",
			brand_type: "restaurant",
			format: "json"
		}),
	};

	const response = await axios(options);
	return res.json(response.data);


}



app.get('/restaurant', getRestaurant);

app.listen(5000, () => {
console.log('listening on port 5000')});


