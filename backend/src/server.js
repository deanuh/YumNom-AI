import express from 'express';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';
import { getFoodFatSecret, getRestaurantFatSecret} from './api/fatsecret.js';
import { getRestaurantTripAdvisor } from './api/tripadvisor.js';
import { getUserCityOpenCage } from './api/opencage.js';
import { authMiddleware } from './auth/auth.js';
import {
  createUser, removeUser,
  createGroup, removeGroup,
  createFavorite, removeFavorite,
  createRecommendation, removeRecommendation,
  createVote, removeVote
} from './api/firestore.js';

let app = express();

let accessToken = null;
let expirationDate = Date.now();

//allow requests from development origin
app.use(cors());
app.use(express.json());

app.get('/restaurant', getRestaurantTripAdvisor);
app.get('/food', getFoodFatSecret);
app.get('/city', getUserCityOpenCage);

// Users
app.post("/users", authMiddleware, createUser);
app.delete("/users", authMiddleware, removeUser);

// Groups
app.post("/groups", authMiddleware, createGroup);
app.delete("/groups", authMiddleware, removeGroup);

// Favorites
app.post("/favorites", authMiddleware, createFavorite);
app.delete("/favorites/:favoriteId", authMiddleware, removeFavorite);

// Recommendations
app.post("/recommendations", authMiddleware, createRecommendation);
app.delete("/recommendations/:recommendationId", authMiddleware, removeRecommendation);

// Votes
app.post("/votes", authMiddleware, createVote);
app.delete("/votes/:voteId", authMiddleware, removeVote);


app.listen(5001, () => {
console.log('listening on port 5001')});
export default app;
