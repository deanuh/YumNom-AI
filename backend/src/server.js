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
import reportIssueRouter from './api/reportIssue.js'; // added for the report issue stuffs

let app = express();

let accessToken = null;
let expirationDate = Date.now();

//allow requests from development origin
app.use(cors({origin: 'http://localhost:3000'}));
app.use(express.json()); // probs will need this for later

app.get('/restaurant', getRestaurantTripAdvisor);
app.get('/food', getFoodFatSecret);
app.get('/city', getUserCityOpenCage);

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

// report Issue   NEW 
app.use("/api", reportIssueRouter);

// THIS IS TO CHECK WHY CURL TEST FOR EMAIL ISNT WORKING
// // quick request logger
// app.use((req, _res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
//   next();
// });
// // checks
// app.get("/api/ping", (_req, res) => res.json({ ok: true }));
// app.post("/api/echo", express.json(), (req, res) => res.json({ ok: true, body: req.body }));

app.listen(5001, () => {
console.log('listening on port 5001')});
export default app;
