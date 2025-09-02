import express from 'express';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';
import { getFoodFatSecret, getRestaurantFatSecret} from './api/fatsecret.js';
import { getRestaurantTripAdvisor } from './api/tripadvisor.js';
import { getUserCityOpenCage } from './api/opencage.js';
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
app.use(cors({origin: 'http://localhost:3000'}));

app.get('/restaurant', getRestaurantTripAdvisor);
app.get('/food', getFoodFatSecret);
app.get('/city', getUserCityOpenCage);

app.listen(5001, () => {
console.log('listening on port 5001')});

// Users
app.post("/users", createUser);
app.delete("/users/:userId", removeUser);

// Groups
app.post("/groups", createGroup);
app.delete("/groups/:groupId", removeGroup);

// Favorites
app.post("/favorites", createFavorite);
app.delete("/favorites/:userId/:favoriteId", removeFavorite);

// Recommendations
app.post("/recommendations", createRecommendation);
app.delete("/recommendations/:userId/:recommendationId", removeRecommendation);

// Votes
app.post("/votes", createVote);
app.delete("/votes/:groupId/:voteId", removeVote);

export default app;
