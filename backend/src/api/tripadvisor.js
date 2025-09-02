import axios from 'axios';
import 'dotenv/config';

const api_key = process.env.TRIPADVISOR_API_KEY;
const base_url = 'https://api.content.tripadvisor.com/api';

// optional: normalize empty strings to undefined
const emptyToUndef = (v) => (v && String(v).trim() !== '' ? v : undefined);

async function getRestaurantTripAdvisor(req, res, next) {
  try {
    const latitude    = emptyToUndef(req.query.latitude);
    const longitude   = emptyToUndef(req.query.longitude);
    const radius      = emptyToUndef(req.query.radius);
    const radiusUnits = emptyToUndef(req.query.radiusUnits) || 'mi';
    const q           = emptyToUndef(req.query.q); // <-- user text

    const params = new URLSearchParams({
      key: api_key,
      category: 'restaurant',
      ...(q ? { searchQuery: q } : {}), // <-- use user input if present
      ...(latitude && longitude && radius
        ? { latLong: `${latitude},${longitude}`, radius, radiusUnit: radiusUnits }
        : {}),
    });

    const { data } = await axios.get(`${base_url}/v1/location/search`, {
      headers: { accept: 'application/json' },
      params,
    });

    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export { getRestaurantTripAdvisor };
