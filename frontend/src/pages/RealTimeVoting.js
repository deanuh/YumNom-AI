import React, { useRef, useEffect, useState } from "react"; // Import necessary modules from React
import "../styles/RealTimeVoting.css";
import { useLocation, useNavigate } from "react-router-dom";
import io from 'socket.io-client'; // Import the socket.io client library
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig.js";
import Join from "../components/RealTimeVoting/Join.js"
import Vote from "../components/RealTimeVoting/Vote.js"
import Wait from "../components/RealTimeVoting/Wait.js"
import End from "../components/RealTimeVoting/End.js"


// const partyMembers = [
//   { name: "Banana", role: "Host", image: "/ban_gato.png" },
//   { name: "LeBron", image: "/lebron.png" },
//   { name: "Apple", image: "/apple.png" },
//   { name: "Miku", image: "/miku.png" },
// ];



export default function VotingPage() {


	const location = useLocation();
	const navigate = useNavigate();
	const { selectedRestaurant } = location.state || {}; // either holds the restaurant name from GroupMealParty.js or not.
	// pull it safely (in case state is missing)
	const [vote, setVote] = useState(null); // Own user's vote
  const [receivedVotes, setReceivedVotes] = useState({}); //Each user's vote including own {userIdOne: 1, userIdTwo: 2, ...}
	const [tally, setTally] = useState({}); // vote count for each vote { "1": 10, "2": 2, ... }
  const [phaseState, setPhaseState] = useState(""); //current phase (round_one OR waiting_phase OR end_phase, etc.)
	const [timer, setTimer] = useState(null);  // in seconds
	const [partyMembers, setPartyMembers] =  useState({}); // State to store users in session, not invited users.
	const socketRef = useRef(null); // Reference to the current socket connection
	const [choices, setChoices] = useState(null); // Possible choices to vote between.
	const [results, setResults] = useState({}); // Last round's results from server. Techically should match tally with 0's if a restaurant didnt get any votes.
	const [winner, setWinner] = useState(null);

	// create a "finalRestaurants" array to display
	const [finalRestaurants, setFinalRestaurants] =  useState([]);
	
	
	// If the selectedRestaurant is NOT already in the list, add it
	//
	const sendNomination = (nomination) => {
		console.log(`nomination: ${nomination}`);
		if (socketRef.current) {
			socketRef.current.emit("send_nomination", nomination)
		}
	};

	const sendVote = () => { // ------------------------------------- Submitted by martin
		if (socketRef.current) {
			socketRef.current.emit("send_vote",  vote);
		}
	}

	useEffect(() => { // if the selectedRestaurant is updated, check if its not null (came from GroupMealParty), then nominate it for the user.
		setTimeout(() => {  // add check or something to stop re-renders from nominating more than once.
			if (selectedRestaurant && socketRef.current) {
				console.log(`selectedRestaurant: ${selectedRestaurant}`);
				sendNomination(selectedRestaurant);
				navigate("/RealTimeVoting", { replace: true, state: null });
			}
		}, 500); // 1 second for socket to connect
	}, [selectedRestaurant, navigate, socketRef]);

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
						console.log(JSON.stringify(data));
  	  		  setPhaseState(data.phaseName); // Set the received vote data to state
						if (data.choices) setChoices(data.choices);
						if (data.results) setResults(data.results);
						if (data.winner) setWinner(data.winner);
						if (data.polling) {
							setReceivedVotes(data.polling);
							const newTally = Object.values(data.polling).reduce((acc, vote) => {
					      acc[Number(vote)] = (acc[Number(vote)] || 0) + 1;
					      return acc;
					    }, {});
					    setTally(newTally);
						}

						
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

					socketRef.current.on("receive_nominations", (nominations) => {
						setFinalRestaurants(nominations);
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
					    const updated = { ...prev };
					    delete updated[userId];
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

	function renderPhase(phaseState) {
		switch (phaseState) { 
  	      case "join":
  	          return(<Join timer={timer} partyMembers={partyMembers} sendNomination={sendNomination} finalRestaurants={finalRestaurants} />);
  	      case "waiting_phase":
  	          return(<Wait timer={timer} partyMembers={partyMembers} finalRestaurants={finalRestaurants} choices={choices} tally={tally} results={results} />);
  	      case "round_one": 
  	      case "round_two":
  	      case "tiebreaker":
  	          return (<Vote phaseState={phaseState} timer={timer} partyMembers={partyMembers} finalRestaurants={finalRestaurants} vote={vote} setVote={setVote} sendVote={sendVote} tally={tally} choices={choices}/>);
  	      case "end_phase":
  	          return (<End timer={timer} partyMembers={partyMembers} finalRestaurants={finalRestaurants} winner={winner} />);
  	      default:
  	          return;
		}
	}

// ---------------------------------------------------------------------------------------------------------------------------------------
  return (
<div>
	{renderPhase(phaseState)}
</div>
  );
}
