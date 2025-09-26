import React, { useRef, useEffect, useState } from "react"; // Import necessary modules from React
import "../styles/RealTimeVoting.css";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client'; // Import the socket.io client library
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig.js";
import Join from "../components/RealTimeVoting/Wait.js"
import Vote from "../components/RealTimeVoting/Vote.js"
import Wait from "../components/RealTimeVoting/Wait.js"

const restaurants = [
  { id: 1, name: "Chipotle", image: "chipotle.png" },
  { id: 2, name: "Pizza Hut", image: "pizzahut.png" },
  { id: 3, name: "Wingstop", image: "wingstop.png" },
];

// const partyMembers = [
//   { name: "Banana", role: "Host", image: "/ban_gato.png" },
//   { name: "LeBron", image: "/lebron.png" },
//   { name: "Apple", image: "/apple.png" },
//   { name: "Miku", image: "/miku.png" },
// ];



export default function VotingPage() {


	const location = useLocation();
	const { chosenRestaurant, selectedFriendObjects } = location.state || {}; 
	// pull it safely (in case state is missing)
	const [vote, setVote] = useState(null);
  const [receivedVotes, setReceivedVotes] = useState({}); // State to store received vote
	const [tally, setTally] = useState({});
  const [phaseState, setPhaseState] = useState(""); // State to store received vote
	const [timer, setTimer] = useState(null);
	const [partyMembers, setPartyMembers] =  useState({});
	const socketRef = useRef(null);
	
	// create a "finalRestaurants" array to display
	const finalRestaurants = [...restaurants];
	
	
	// If the chosenRestaurant is NOT already in the list, add it
	if (chosenRestaurant && !restaurants.some(r => r.name.toLowerCase() === chosenRestaurant.toLowerCase())) {
	finalRestaurants.push({
	    // id: restaurants.length + 1,  // unique id
	    id: 4,
	    name: chosenRestaurant,
	    image: `${chosenRestaurant.toLowerCase()}.png`
	});
	}

	const sendVote = () => { // ------------------------------------- Submitted by martin
		if (socketRef.current) {
			socketRef.current.emit("send_vote",  vote);
		}
	}

  useEffect(() => {
		const interval = setInterval(() => { 
			setTimer(timer => {
				if (timer > 0) return timer - 1;
				clearInterval(interval);
				return 0;
			});
		}, 1000);



	


		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			try {
				if (user && !socketRef.current) {
					const user = auth.currentUser;

					const JWT = await user.getIdToken();	
			
					socketRef.current = io(process.env.REACT_APP_SOCKETIO_BACKEND_URL, {
						auth: { token: JWT },
					});
		
  	  		// Listen for incoming votes from the server
  	  		socketRef.current.on("change_phase", (data) => {
  	  		  setPhaseState(data.phaseName); // Set the received vote data to state
						setTimer(Math.ceil((data.endsAt  - Date.now()) / 1000));
  	  		});
	

					socketRef.current.on("receive_vote", (data) => {
					  setReceivedVotes((prev) => {
					    const updated = {
					      ...prev,
					      [data.user]: data.vote,
					    };
					
					    const newTally = Object.values(updated).reduce((acc, vote) => {
					      acc[Number(vote)] = (acc[Number(vote)] || 0) + 1;
					      return acc;
					    }, {});
					
					    setTally(newTally);
					    return updated;
					  });
					});
					
					socketRef.current.on("get_members", (party) => {
						setPartyMembers(party);
					});

					socketRef.current.on("joined_room", (partyMember) => {
						setPartyMembers(prev => {
                const newParty = {
                ...prev,
                [partyMember.userId]: {
                    profile_picture: partyMember.profile_picture,
                    username: partyMember.username
                }
            }
            return newParty;
            });
					});

					socketRef.current.on("left_room", (userId) => {
						setPartyMembers(prev => { 
							const updated = prev;
							updated.delete(userId);
							return updated;
						});
					});

					socketRef.current.on("join_error", (data) => {
						console.error("Error joining room: ", data.message);
					});


					socketRef.current.emit("join_room");

  	  		// Cleanup the effect by removing the event listener when the component unmounts
				}
  	  } catch(err) {
				console.error("Error retrieving current user: ", err.vote);
			}
		});


	return () => {
					clearInterval(interval);
  	  	  socketRef.current?.disconnect()
					unsubscribe();
  };
}, []); // Empty dependency array ensures this runs only once when the component mounts

// ---------------------------------------------------------------------------------------------------------------------------------------
  return (
<div>
  <p>{phaseState}</p>
{ (() => {
    switch (phaseState) { 
        case "join":
            return(<Join timer={timer} partyMembers={partyMembers} />);
        case "waiting_phase":
            return(<Wait timer={timer} partyMembers={partyMembers} finalRestaurants={finalRestaurants} tally={tally} />);
        case "round_one": 
        case "round_two":
        case "tiebreaker":
            return (<Vote phaseState={phaseState} timer={timer} partyMembers={partyMembers} finalRestaurants={finalRestaurants} vote={vote} setVote={setVote} sendVote={sendVote} tally={tally} />);
        case "end_phase":
            return (<p>End</p>);

        default:
            return(<p>oops</p>);
    }
})()}
</div>
  );
}
