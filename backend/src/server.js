import express from 'express';
import axios from 'axios';
import cors from 'cors';
import http from 'http';
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
import { Server } from 'socket.io';

let app = express();

let accessToken = null;
let expirationDate = Date.now();

//allow requests from development origin
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
			origin: "http://localhost:3000",
      methods: ["GET", "POST"], 
    },
  });

// Listen for incoming Socket.IO connections
io.on("connection", (socket) => {
    console.log("User connected ", socket.id); // Log the socket ID of the connected user

    // Listen for "send_message" events from the connected client
    socket.on("send_message", (data) => {
        console.log("Message Received ", data); // Log the received message data

        // Emit the received message data to all connected clients
        io.emit("receive_message", data);
    });
});

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
	console.log('listening on port 5001');
});

server.listen(7001, () => {
  console.log('Server is running on port 7001');
});

export default app;
