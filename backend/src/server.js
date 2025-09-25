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
  createFavorite, removeFavorite, listFavorites,
  createRecommendation, removeRecommendation,
  createVote, removeVote,
} from './api/firestore.js';
import reportIssueRouter from './api/reportIssue.js'; // added for the report issue stuffs
import usersRouter from "./api/deleteUser.js";
import { addGroup, deleteGroup, getGroupFromUserId, getGroupFromGroupId } from './firebase/dbFunctions.js'
import { getAuth } from 'firebase-admin/auth';
import { Server } from 'socket.io';
import deleteUserRouter from "./api/deleteUser.js";

let app = express();
app.use(express.json());
let accessToken = null;
let expirationDate = Date.now();

//allow requests from development origin

// ADDED THESE FOR THE DELETE ACCOUNT TESTING AND MAKING SURE IT WORKS
// {
app.use(cors({
	origin: "http://localhost:3000",   // frontend dev server
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
  }));
  
app.use(express.json());
// added this to check delete account is actually working
app.use((req, _res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
	next();
  });

// }
  
app.use(cors());

// #################### WEBSOCKET SERVER ###############################
// This is a seperate server used with Socket.IO in order to start the real-time voting
// sessions. All real-time voting / socket-related code and will be moved later.
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
			origin: "http://localhost:3000",
      methods: ["GET", "POST"], 
    },
  });

const groupInfo = {};
const users = {};

io.use(async (socket, next) => {
  try {
    const idToken = socket.handshake.auth.token;
    const decodedToken = await getAuth().verifyIdToken(idToken);
		if (users[decodedToken.uid]) throw new Error(`User ${socket.uid} already connected through socket ${users[decodedToken.uid]}`);
    socket.uid = decodedToken.uid; // attach UID to socket
		users[socket.uid] = socket.id;
    next();
  } catch (err) {
		console.log(err);
    next(new Error("Authentication error"));
  }
});

function startPhase(groupId, duration, phaseName) {
	if (!groupInfo[groupId]) {
		groupInfo[groupId] = {
			timer: {
				main: null,
				endsAt: null,
			},
			state: "",
			votes: {
				polling: {},
				results: {}
			},
			choices: ["A", "B", "C", "D"] //placeholder debug values
		};
	}

	const waitTime = 10;
	const voteTime = 15;
	groupInfo[groupId].state = phaseName;
	groupInfo[groupId].timer.endsAt = Date.now() + duration * 1000;

	io.to(groupId).emit("change_phase", { endsAt: groupInfo[groupId].timer.endsAt, phaseName: groupInfo[groupId].state});

	groupInfo[groupId].timer.main = setTimeout(() => {
		const tally = Object.values(groupInfo[groupId].votes.polling).reduce((acc, vote) => {
			acc[vote] = ( acc[vote] || 0 ) + 1;
			return acc
		}, {});
		const sortedTally = Object.entries(tally).sort((a, b) => b[1] - a[1]);
		groupInfo[groupId].votes.results = sortedTally;
		
		groupInfo[groupId].votes.polling = {}
		delete groupInfo[groupId].timer.main;

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

		groupInfo[groupId].state = "waiting_phase";
		groupInfo[groupId].timer.endsAt = Date.now() + waitTime * 1000;
		io.to(groupId).emit("change_phase", { endsAt: groupInfo[groupId].timer.endsAt, phaseName: groupInfo[groupId].state});
		groupInfo[groupId].timer.wait = setTimeout(() => {
			const topTwo = sortedTally.slice(0, 2)
			const topTwoNames = topTwo.map(([choice, count]) => choice);
			const topTwoTally = topTwo.map(([choice, count]) => count);			
			if (topTwoTally[0] === topTwoTally[1]) {
				groupInfo[groupId].choices = topTwoNames;
			} else {
				groupInfo[groupId].choices = [topTwoNames[0]];
			}
			groupInfo[groupId].votes.results = {}
			delete groupInfo[groupId].timer.wait;
			if (nextPhase) {
				if ( (nextPhase === "round_two" || nextPhase === "tiebreaker" ) && groupInfo[groupId].choices.length > 1) {
					nextPhase = "end_phase"
				}
				startPhase(groupId,  voteTime, nextPhase);
			} else {
				delete groupInfo[groupId].timer;
				groupInfo[groupId].state = "end_phase";
				getGroupFromGroupId(groupId)
				.then(groupData => {	
					return deleteGroup(groupData.owner_id)
				})
				.catch(err => {
					console.error(err);
				});
			}
			io.to(groupId).emit("end_phase");
			return;
		}, waitTime * 1000); //  (duration) ms * 1000 = (duration) sec

	}, duration * 1000); //  (duration) ms * 1000 = (duration) sec

}

async function joinGroup(userId) { //we're going to need a seperate dbFunction that adds a user to group.
      try {
				let groupData = await getGroupFromUserId(userId);
				console.log(`groupData: ${JSON.stringify(groupData)}`);
				let createdGroup = false;
				//grab groupId from existing/new group.
				let groupId;
				if (groupData) {
					groupId = groupData.id;
					const expiresAt = new Date(groupData.date_created.toDate().getTime() + groupData.secondsUntilExpiration * 1000)
					if (expiresAt < Date.now()) {
						await deleteGroup(userId);
						groupId = await addGroup(userId);
						createdGroup = true;
					};
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
        let groupData = await getGroupFromGroupId(groupId); 
        let invitedUsers = groupData.members;
				console.log(`groupId: ${groupId}, createdGroup: ${createdGroup}`);

				if (createdGroup) {
					startPhase(groupId, 20, "join");
				}
				socket.groupId = groupId;
        socket.join(socket.groupId);
				const socketsInGroup = await io.in(socket.groupId).fetchSockets();
				const uids = socketsInGroup.map(s => s.uid);
        const uidInfo = uids.reduce((acc, key) => {
           if (invitedUsers[key]) acc[key] = invitedUsers[key];
           return acc;
        }, {});

        
				socket.emit("get_members", uidInfo)
        socket.broadcast.to(socket.groupId).emit("joined_room", { 
					userId: socket.uid, 
          profile_picture: uidInfo[socket.uid].profile_picture,
          username: uidInfo[socket.uid].username
				});
				socket.emit("change_phase", { endsAt: groupInfo[groupId].timer.endsAt, phaseName: groupInfo[groupId].state});
      } catch (err) {
        socket.emit("join_error", { message: err.message });
      }
    });

    socket.on("send_vote", ( vote ) => {
			if (!socket.groupId) return socket.emit("join_error", { message: "User not in room."});
			if (
				groupInfo[socket.groupId].state ==  "round_one" || 
				groupInfo[socket.groupId].state ==  "round_two" || 
				groupInfo[socket.groupId].state ==  "tiebreaker" 
			) {
				groupInfo[socket.groupId].votes.polling[socket.uid] = vote
      	io.to(socket.groupId).emit("receive_vote", {
      	  user: socket.uid,
      	  vote,
      	});
			}
    });
	socket.on("disconnect", (reason) => {
		delete users[socket.uid];
		io.to(socket.groupId).emit("left_room", socket.uid);
		console.log(`User ${socket.uid} disconnected`);
		
	})
});

// ############################################################


// ############# ROUTERS ######################################
// These are all the routers available on the server. These will be moved
// to their own file via a router export at a later time.
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
app.get("/favorites", authMiddleware, listFavorites);            
app.delete("/favorites/:favoriteId", authMiddleware, removeFavorite);

// Recommendations
app.post("/recommendations", authMiddleware, createRecommendation);
app.delete("/recommendations/:recommendationId", authMiddleware, removeRecommendation);

// Votes
app.post("/votes", authMiddleware, createVote);
app.delete("/votes/:voteId", authMiddleware, removeVote);



app.use("/api", reportIssueRouter);


// delete account NEW
app.use("/api", deleteUserRouter);

// THIS IS TO CHECK WHY CURL TEST FOR EMAIL ISNT WORKING  -- update it works
// // quick request logger
// app.use((req, _res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
//   next();
// });
// // checks
// app.get("/api/ping", (_req, res) => res.json({ ok: true }));
// app.post("/api/echo", express.json(), (req, res) => res.json({ ok: true, body: req.body }));

// All backend services available via this port
app.listen(5001, () => {
	console.log('listening on port 5001');
});

// Socket.IO server via this port.
server.listen(7001, () => {
  console.log('Server is running on port 7001');
});

export default app;
