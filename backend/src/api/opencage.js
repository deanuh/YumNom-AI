import express from 'express';
import axios from 'axios';
import 'dotenv/config';

const api_key = process.env.OPENCAGE_API_KEY;
const url = 'https://api.opencagedata.com/geocode/v1/json';

async function getUserCityOpenCage(req, res, next) {
	const latitude = req.query.latitude;
	const longitude = req.query.longitude;

	var options = {
		method: "GET",
		url: url,
		params: new URLSearchParams({
			q: `${latitude}+${longitude}`,
			key: api_key,
		}),
	};

	const response = await axios(options);
	return res.json(response.data);
}

export { getUserCityOpenCage };
