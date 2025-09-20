import express from 'express';
import axios from 'axios';
import cors from 'cors';
import http from 'http';
import 'dotenv/config';
import aiRoutes from './api/ai/routes.js';
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
import { addGroup, getGroup } from './firebase/dbFunctions.js'
import { getAuth } from 'firebase-admin/auth';
import { Server } from 'socket.io';

let app = express();

let accessToken = null;
let expirationDate = Date.now();

//allow requests from development origin
app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
			origin: "http://localhost:3000",
      methods: ["GET", "POST"], 
    },
  });

const groupTimers = {};
const groupState = {};

io.use(async (socket, next) => {
  try {
    const idToken = socket.handshake.auth.token;
    const decodedToken = await getAuth().verifyIdToken(idToken);
    socket.uid = decodedToken.uid; // attach UID to socket
    next();
  } catch (err) {
		console.log(err);
    next(new Error("Authentication error"));
  }
});

function startPhase(groupId, duration, phaseName) {
	if (!groupTimers[groupId]) groupTimers[groupId] = {};

	const waitTime = 10;
	const voteTime = 15;
	groupState[groupId] = phaseName;
	groupTimers[groupId].endsAt = Date.now() + duration * 1000;

	io.to(groupId).emit("change_phase", { endsAt: groupTimers[groupId].endsAt, phaseName: groupState[groupId]});

	groupTimers[groupId].main = setTimeout(() => {
		delete groupTimers[groupId].main;

		let nextPhase;
		switch (phaseName) {
			case "join": 
				nextPhase = "round_one";
				break;
			case "round_one":
				nextPhase = "round_two";
				break;
			case "round_two":
				nextPhase = "tiebreaker";
				break;
			case "tiebreaker":
				nextPhase = null;
				break;
			default:
				console.log(`Error on phase ${phaseName}`);
				nextPhase = null;
		}

		groupState[groupId] = "waiting_phase";
		groupTimers[groupId].endsAt = Date.now() + waitTime * 1000;
		io.to(groupId).emit("change_phase", { endsAt: groupTimers[groupId].endsAt, phaseName: groupState[groupId]});
		groupTimers[groupId].wait = setTimeout(() => {
			delete groupTimers[groupId].wait;
			if (nextPhase) {
				startPhase(groupId,  voteTime, nextPhase);
			} else {
				delete groupTimers[groupId];
				groupState[groupId] = "end_phase";
				io.to(groupId).emit("end_phase");
				return;
			}
		}, waitTime * 1000); //  (duration) ms * 1000 = (duration) sec

	}, duration * 1000); //  (duration) ms * 1000 = (duration) sec

}

async function joinGroup(userId) {
      try {
				let groupData = await getGroup(userId);
				console.log(`groupData: ${JSON.stringify(groupData)}`);
				let createdGroup = false;
				//grab groupId from existing/new group.
				let groupId;
				if (groupData) {
					groupId = groupData.id;
				} else {
					groupId = await addGroup(userId);
					createdGroup = true;
				}
    		return { groupId, createdGroup };
			} catch(err) {
				throw new Error("Error joining group: " + err.message);
			}

}
io.on("connection", (socket) => {
  console.log("User connected", socket.id, "with UID", socket.uid);


    socket.on("join_room", async () => {
			try {
				let { groupId, createdGroup } = await joinGroup(socket.uid);
				console.log(`groupId: ${groupId}, createdGroup: ${createdGroup}`);

				if (createdGroup) {
					startPhase(groupId, 20, "join");
				}
				socket.groupId = groupId;
        socket.join(socket.groupId);
        socket.broadcast.to(groupId).emit("joined_room", socket.uid);
				socket.emit("change_phase", { endsAt: groupTimers[groupId].endsAt, phaseName: groupState[groupId]});
      } catch (err) {
        socket.emit("join_error", { message: err.message });
      }
    });

    socket.on("send_message", ({ message }) => {
			if (!socket.groupId) return socket.emit("join_error", { message: "User not in room."});
      io.to(socket.groupId).emit("receive_message", {
        user: socket.uid,
        message,
      });
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
