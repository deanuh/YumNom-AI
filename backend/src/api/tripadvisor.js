import express from 'express';
import axios from 'axios';
import 'dotenv/config';

const api_key = process.env.TRIPADVISOR_API_KEY
const base_url = 'https://api.content.tripadvisor.com/api';

async function getRestaurantTripAdvisor(req, res, next) {

	var options = {
		method: "GET",
		url: base_url + '/v1/location/search',
		headers: {
			accept: 'application/json'
		},
		params: new URLSearchParams({
			key: api_key,
			searchQuery: 'mcdonalds',
			category: 'restaurant',
		}),
	};

	const response = await axios(options);
	return res.json(response.data);

}


export {getRestaurantTripAdvisor};
