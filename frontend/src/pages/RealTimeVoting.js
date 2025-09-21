import React, { useRef, useEffect, useState } from "react"; // Import necessary modules from React
import "../styles/RealTimeVoting.css";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client'; // Import the socket.io client library
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig.js";

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
	const partyMembers = selectedFriendObjects || [];
	const socketRef = useRef(null);
	
	const MAX_VOTES = partyMembers.length; // e.g., 4
	const [totalVotes, setTotalVotes] = useState(0);
	
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

	const sendVote = () => {
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
					
  	  		// Listen for incoming votes from the server
					socketRef.current = io(process.env.REACT_APP_SOCKETIO_BACKEND_URL, {
						auth: { token: JWT },
					});

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


  return (
    <div className="voting-page">
    <div class="voting-title-container">
      <h1 className="voting-title">VOTING BEGINS</h1>
      </div>
      <h3 className="round-title">Round 1</h3>
			<p> {phaseState} </p>
			<p> {timer} </p>
			
      <div className="voting-section">
        <div className="party-column">
        <h4>Party Members</h4>
            {partyMembers.map((member, i) => (
            <div key={i} className="party-avatar">
              <img src={`/${member.image}`} alt={member.username} />
              <div>{member.username}</div>
            </div>
          ))}
        </div>

        <div className="Voting-restaurant-grid">
          {finalRestaurants.map(r => (
            <div
              key={r.id}
              className={`Voting-restaurant-option ${vote === r.id ? "selected" : ""}`}
              onClick={() => setVote(r.id)}
            >
              <img src={r.image} alt={r.name} />
            </div>
          ))}
          <button className="Voting-submit-button" onClick={sendVote} >
            Submit
          </button>
        </div>
      </div>

      <h2 className="Voting-results-title">Results</h2>
      <div className="Voting-results-section">
        {finalRestaurants.map((r, i) => (
          <div key={i} className="result-row">
            <img src={r.image} alt={r.name} className="result-icon" />
            <div className="result-bar-container">
              <div
                className="result-bar"
                style={{ width: `${tally[r.id] * 130}px` }}  // the 110 is for how long the vote will appear on the bar
              />
            </div>
            <div className="vote-count">({tally[r.id]})</div>
          </div>
        ))}
      </div>
    </div>
  );
}
