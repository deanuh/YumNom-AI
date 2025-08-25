import express from 'express';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';
import { getFoodFatSecret, getRestaurantFatSecret} from './api/fatsecret.js';
import { getRestaurantTripAdvisor } from './api/tripadvisor.js';
import { getUserCityOpenCage } from './api/opencage.js';
let app = express();

let accessToken = null;
let expirationDate = Date.now();

//allow requests from development origin
app.use(cors({origin: 'http://localhost:3000'}));

app.get('/restaurant', getRestaurantTripAdvisor);
app.get('/food', getFoodFatSecret);
app.get('/city', getUserCityOpenCage);

app.listen(5000, () => {
console.log('listening on port 5000')});


