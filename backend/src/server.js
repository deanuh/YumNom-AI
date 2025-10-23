import express from 'express';
import axios from 'axios';
import cors from 'cors';
import http from 'http';
import 'dotenv/config';
import aiRoutes from './api/ai/routes.js';
import { getFoodFatSecret, getRestaurantFatSecret} from './api/fatsecret.js';
import { getRestaurantTripAdvisor, getTAPlaceDetails } from './api/tripadvisor.js';
import { fetchFoodImageByDish, fetchUnsplashImageFor } from "./api/unsplash.js";
import { getUserCityOpenCage } from './api/opencage.js';
import { authMiddleware } from './auth/auth.js';
import { getLogo, getLogoData } from './api/logo.js';
import {
  createUser, removeUser,
  createGroup, removeGroup,
  createFavorite, removeFavorite, listFavorites,
  createRecommendation, removeRecommendation,
  createVote, removeVote,
  savePreferences, readPreferences,
} from './api/firestore.js';
import reportIssueRouter from './api/reportIssue.js'; // added for the report issue stuffs
import usersRouter from "./api/deleteUser.js";
import { addGroup, deleteGroup, getGroupFromUserId, getGroupFromGroupId } from './firebase/dbFunctions.js'
import { getAuth } from 'firebase-admin/auth';
import { Server } from 'socket.io';
import deleteUserRouter from "./api/deleteUser.js";
import chatBotRouter from "./api/chatBot.js";  // had to change from { chatBotRouter} to w/o {} bc it would not actually connect
import invitesRouter from './api/invites.js';

let app = express();
app.use(express.json());

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

app.use('/api/ai', aiRoutes);

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

function startPhase(groupId, duration, phaseName, nominations) {
	if (!groupInfo[groupId]) { // initialize object 
		groupInfo[groupId] = { 
			timer: {
				main: null, // reference to setTimeout timer
				endsAt: null, //timestamp for current phase end
			},
			state: "", //phaseName
			votes: {
				polling: {}, //current votes for voting phases. {"userIdOne": "1", "userIdTwo": "2", ...}
				results: {} //result for waiting phases and end {"1": 10, "2": 3, "3": 0}
			},
			choices: [], //available restaurants to choose ["1", "2", "3"]
			nominations // On join, stores each user's restaurant string search entry. i.e. "Raising Cane". After the join phase, it holds the finalRestaurants format of all restaurants nominated. [{"id": "0", "name": "Raising Cane", "logo_url": "..."}, {...}]
		};
	}

	const waitTime = 10;
	const voteTime = 30;

	if (!groupInfo[groupId]) return;
	groupInfo[groupId].state = phaseName; //name of current phase.
	groupInfo[groupId].timer.endsAt = Date.now() + duration * 1000;
	console.log(`choices on ${phaseName}: ${groupInfo[groupId].choices}`);
	io.to(groupId).emit("change_phase", { endsAt: groupInfo[groupId].timer.endsAt, phaseName: groupInfo[groupId].state, choices: groupInfo[groupId].choices});
	//send event and end after timeout
	groupInfo[groupId].timer.main = setTimeout(() => {
		if (!groupInfo[groupId]) return;
		const baseVotes = Object.fromEntries(groupInfo[groupId].choices.map((choice) => [choice, 0])); 
		//init object with key as restaurant and values 0
		const tally = Object.values(groupInfo[groupId].votes.polling).reduce((acc, vote) => {
			acc[vote] = ( acc[vote] || 0 ) + 1;
			return acc
		}, {}); // transform polling object to key as restaurant and values 0.
		const voteResult = {...baseVotes, ...tally}; //all restaurants and their vote count, even with 0 votes.
		groupInfo[groupId].votes.results = voteResult;
		groupInfo[groupId].votes.polling = {} //reset for next phase
		if (groupInfo[groupId]?.timer.main) clearTimeout(groupInfo[groupId].timer.main);
		if (groupInfo[groupId]?.timer.wait) clearTimeout(groupInfo[groupId].timer.wait);
		delete groupInfo[groupId].timer.main; 

		let nextPhase; // on null, end. on val, go to next phase.
		switch (phaseName) {
			case "join": 
				console.log(groupInfo[groupId].nominations);
				if (Object.keys(groupInfo[groupId].nominations).length === 0) {
					console.log("no nominations");
					groupInfo[groupId].state = "end_phase"; // unique end event, group will be deleted before sending.
					getGroupFromGroupId(groupId)
					.then(groupData => {	
						return deleteGroup(groupData.owner_id)
					})
					.catch(err => {
						console.error(err);
					});
					if (groupInfo[groupId]?.timer.main) clearTimeout(groupInfo[groupId].timer.main);
					if (groupInfo[groupId]?.timer.wait) clearTimeout(groupInfo[groupId].timer.wait);
					delete groupInfo[groupId].timer; //lose all timers
					delete groupInfo[groupId];
				return;
				}
				else {
					nextPhase = "round_one";
					const nominationList = Object.values(groupInfo[groupId].nominations);
					console.log(nominationList);
					const uniqueRestaurantObjects = Object.values(nominationList.reduce((acc, nomination) => {
						acc[nomination.logo_url] = { ...nomination };
						return acc;
					}, {}));
					console.log(`uniqueRestaurantObjects: ${JSON.stringify(uniqueRestaurantObjects)}`);
					const restaurantWithId = uniqueRestaurantObjects.map((obj, i) => ({
						id: `${i}`,
						image: obj.logo_url,
						name: obj.name
					}));
					console.log(`restaurantWithId: ${JSON.stringify(restaurantWithId)}`);

					groupInfo[groupId].nominations = restaurantWithId;
					console.log(groupInfo[groupId].nominations);
					groupInfo[groupId].choices = groupInfo[groupId].nominations.map(obj => obj.id);
					console.log(groupInfo[groupId].choices);
					io.to(groupId).emit("receive_nominations", groupInfo[groupId].nominations);
					startPhase(groupId,  voteTime, nextPhase); //skip wait.
					return;
				}
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
		groupInfo[groupId].state = "waiting_phase"; //now that timeout has ended, phase change to wait
		groupInfo[groupId].timer.endsAt = Date.now() + waitTime * 1000;
		io.to(groupId).emit("change_phase", { endsAt: groupInfo[groupId].timer.endsAt, phaseName: groupInfo[groupId].state, results: groupInfo[groupId].votes.results});
		//send event and start wait phase
		groupInfo[groupId].timer.wait = setTimeout(() => {
			if (!groupInfo[groupId]) return;
			const highestVote = Math.max(...Object.values(groupInfo[groupId].votes.results));
			//console.log(`results: ${JSON.stringify(groupInfo[groupId].votes.results)}`);
			const topVotes = Object.keys(groupInfo[groupId].votes.results).filter(result => groupInfo[groupId].votes.results[result] === highestVote);
			// topVote is array of all restaurants that tied with highest count.
			groupInfo[groupId].choices = topVotes;
			groupInfo[groupId].votes.results = {}; // reset for next waiting phase
			delete groupInfo[groupId].timer.wait; // lose wait phase timeout reference
			if ( (nextPhase === "round_two" || nextPhase === "tiebreaker" ) && groupInfo[groupId].choices.length <= 1) {
					nextPhase = null; // end phase early if there was a clear winner.
			}
			if (nextPhase) {
								startPhase(groupId,  voteTime, nextPhase);
			} else { // only if nextPhase is null. meaning no more voting
				delete groupInfo[groupId].timer; //lose all timers
				groupInfo[groupId].state = "end_phase"; // unique end event, group will be deleted before sending.
				getGroupFromGroupId(groupId)
				.then(groupData => {	
					return deleteGroup(groupData.owner_id)
				})
				.catch(err => {
					console.error(err);
				});
				io.to(groupId).emit("change_phase", { endsAt: Date.now(), phaseName: groupInfo[groupId].state, winner: groupInfo[groupId].choices[0]});
				// group is now officially gone
			}
			delete groupInfo[groupId];
			return; // all nextPhase values reach this eventually.
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
				if (groupData) { //probably invited or reloaded the page
					groupId = groupData.id;
					const expiresAt = new Date(groupData.date_created.toDate().getTime() + groupData.secondsUntilExpiration * 1000)
					if (expiresAt < Date.now()) { // in case group is old and forgotten :(
						await deleteGroup(userId);
						groupId = await addGroup(userId);
						createdGroup = true;
					};
				} else { // you create and own this group if you reach this
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
					startPhase(groupId, 30, "join", {}); // bring GroupMealParty state here.
				}
				socket.groupId = groupId;
        socket.join(socket.groupId);
				const socketsInGroup = await io.in(socket.groupId).fetchSockets();
				const uids = socketsInGroup.map(s => s.uid); //we know what socket belongs to what user.
        const uidInfo = uids.reduce((acc, key) => { // list of the invited users information actually connected to the session.
           if (invitedUsers[key]) acc[key] = invitedUsers[key];
           return acc;
        }, {});

        
				socket.emit("get_members", uidInfo) // sent to client
        socket.broadcast.to(socket.groupId).emit("joined_room", { //everyone else is sent the user's info too
					userId: socket.uid, 
          profile_picture: uidInfo[socket.uid].profile_picture,
          username: uidInfo[socket.uid].username
				});
				console.log(`socket.uid: ${socket.uid}, profile_picture: ${uidInfo[socket.uid].profile_picture}, uidInfo: ${JSON.stringify(uidInfo)}`);
				if (!groupInfo[groupId]) return;
				socket.emit("change_phase", { endsAt: groupInfo[groupId].timer.endsAt, phaseName: groupInfo[groupId].state, results: groupInfo[groupId].votes.results, choices: groupInfo[groupId].choices});
				socket.emit("receive_nominations", groupInfo[groupId].nominations);
				//client is sent info on current phase's state.
      } catch (err) {
        socket.emit("join_error", { message: err.message });
      }
    });

		socket.on("send_nomination", async ( nomination ) => {
			if (!socket.groupId) return socket.emit("join_error", { message: "User not in room."});
			if (!nomination || typeof nomination != "string") return;
			if (!groupInfo[socket.groupId]) return;
			if (groupInfo[socket.groupId].state == "join") {
				const logoData = await getLogoData(nomination);
				groupInfo[socket.groupId].nominations[socket.uid] = logoData;
				console.log(`UID: ${socket.uid}`);
				console.log(`nomination: ${JSON.stringify(nomination)}`);
				console.log(`nominations: ${JSON.stringify(groupInfo[socket.groupId].nominations)}`);
			}
		});


    socket.on("send_vote", ( vote ) => {
			if (!socket.groupId) return socket.emit("join_error", { message: "User not in room."});
			if (!groupInfo[socket.groupId]) return;
			if (
				groupInfo[socket.groupId].state ==  "round_one" ||  // only accept votes that are valid.
				groupInfo[socket.groupId].state ==  "round_two" || 
				groupInfo[socket.groupId].state ==  "tiebreaker" 
			) {
				if (groupInfo[socket.groupId].choices.includes(vote)) {
					groupInfo[socket.groupId].votes.polling[socket.uid] = vote
      		io.to(socket.groupId).emit("receive_vote", { // update clients on who just voted.
      		  user: socket.uid,
      		  vote,
      		});
				}
			}
    });
	socket.on("disconnect", (reason) => {
		delete users[socket.uid]; //socket is no longer valid, delete incase client rejoins.
		if (socket.groupId && groupInfo[socket.groupId]) {
		  delete groupInfo[socket.groupId].nominations[socket.uid];
		  delete groupInfo[socket.groupId].votes.polling[socket.uid];
		}
		io.to(socket.groupId).emit("left_room", socket.uid); //tell clients to drop leaver's data.
		console.log(`User ${socket.uid} disconnected`);
		
	})
});

// ############################################################


// ############# ROUTERS ######################################
// These are all the routers available on the server. These will be moved
// to their own file via a router export at a later time.
app.get('/restaurant', getRestaurantTripAdvisor);
app.get('/restaurantFatSecret', getRestaurantFatSecret);
app.get('/logo', getLogo);
app.get("/api/restaurants/:id", getTAPlaceDetails);  
app.get('/food', getFoodFatSecret);
app.get('/city', getUserCityOpenCage);
// Return an image URL for a dish name/cuisine using Unsplash (server-side key)
app.get("/api/images/dish", async (req, res) => {
	try {
	  const name = (req.query.name || "").trim();
	  const cuisine = (req.query.cuisine || "").trim();
	  const category = (req.query.category || cuisine || "food").trim();
	  const seed = (req.query.seed || name || Date.now()).toString();
  
	  // 1) Prefer a specific dish match
	  const byDish = name ? await fetchFoodImageByDish(name, cuisine) : null;
  
	  // 2) Otherwise use a category/cuisine fallback
	  const url = byDish || (await fetchUnsplashImageFor(category, seed, name));
  
	  res.json({ url: url || null });
	} catch (e) {
	  console.error("GET /api/images/dish failed:", e.message);
	  res.status(500).json({ url: null });
	}
  });
  

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

// Preferences
app.get("/preferences", authMiddleware, readPreferences);
app.post("/preferences", authMiddleware, savePreferences);



app.use("/api", reportIssueRouter);

// delete account NEW
app.use("/api", deleteUserRouter);

// this is for the chatBot api calling
app.use("/api/chatBot", chatBotRouter)


// Invite routes
app.use("/api/invites", invitesRouter);

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
