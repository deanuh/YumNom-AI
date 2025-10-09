// import express from 'express';
// import axios from 'axios';
// import 'dotenv/config';

// const api_key = process.env.OPENCAGE_API_KEY;
// const url = 'https://api.opencagedata.com/geocode/v1/json';

// async function getUserCityOpenCage(req, res, next) {
// 	const latitude = req.query.latitude;
// 	const longitude = req.query.longitude;

// 	var options = {
// 		method: "GET",
// 		url: url,
// 		params: new URLSearchParams({
// 			q: `${latitude}+${longitude}`,
// 			key: api_key,
// 		}),
// 	};

// 	const response = await axios(options);
// 	return res.json(response.data);
// }

// export { getUserCityOpenCage };
// backend/src/opencage.js
import express from "express";
import axios from "axios";
import "dotenv/config";

// OpenCage API setup
const api_key = process.env.OPENCAGE_API_KEY;
const url = "https://api.opencagedata.com/geocode/v1/json";

/**
 * Validate numeric coordinate is within expected range.
 * - n: input value (string or number)
 * - min/max: allowed range (lat = -90→90, lng = -180→180)
 */
function isValidCoord(n, min, max) {
  const x = Number(n);
  return Number.isFinite(x) && x >= min && x <= max;
}

/**
 * Express handler: GET /city
 * Query params: ?latitude=xx&longitude=yy
 *
 * Validates input, calls OpenCage API, and returns city/state info.
 */
async function getUserCityOpenCage(req, res) {
  try {
    // 1. Fail fast if API key missing
    if (!api_key) {
      return res.status(500).json({ error: "Server misconfigured: missing OPENCAGE_API_KEY" });
    }
    // 2. Validate latitude & longitude ranges
    const { latitude, longitude } = req.query;
    if (!isValidCoord(latitude, -90, 90) || !isValidCoord(longitude, -180, 180)) {
      return res.status(400).json({ error: "Invalid latitude/longitude" });
    }
    // 3. Call OpenCage API (limit 1 result, English output)
    const { data } = await axios.get(url, {
      params: {
        q: `${latitude},${longitude}`,
        key: api_key,
        limit: 1,
        no_annotations: 1,
        language: "en"
      },
      timeout: 8000
    });
     // 4. Ensure API returned usable results
    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return res.status(404).json({ error: "No results for coordinates" });
    }
    // 5. Success → send data back to client
    return res.json(data);
  } catch (err) {
    // Catch-all error handler
    const status = err.response?.status || 500;
    return res.status(status).json({
      error: "Reverse geocoding failed",
      detail: err.message || "Unknown error"
    });
  }
}

export { getUserCityOpenCage };