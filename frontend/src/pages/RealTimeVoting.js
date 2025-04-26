import React, { useState } from "react";
import "../styles/RealTimeVoting.css";
import { useLocation } from "react-router-dom";

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
    const [selectedId, setSelectedId] = useState(null);
    const [votes, setVotes] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });

    const partyMembers = selectedFriendObjects || [];

    const MAX_VOTES = partyMembers.length; // e.g., 4
    const [totalVotes, setTotalVotes] = useState(0);

    

    const handleVote = () => {
        if (!selectedId || totalVotes >= MAX_VOTES) return;
        setVotes(prev => ({ ...prev, [selectedId]: prev[selectedId] + 1 }));
        setTotalVotes(prev => prev+1);
    };

    // create a "finalRestaurants" array to display
    const finalRestaurants = [...restaurants];
    

    // If the chosenRestaurant is NOT already in the list, add it
    if (chosenRestaurant && !restaurants.some(r => r.name.toLowerCase() === chosenRestaurant.toLowerCase())) {
    finalRestaurants.push({
        id: restaurants.length + 1,  // unique id
        name: chosenRestaurant,
        image: `${chosenRestaurant.toLowerCase()}.png`
    });
    }


  return (
    <div className="voting-page">
    <div class="voting-title-container">
      <h1 className="voting-title">VOTING BEGINS</h1>
      </div>
      <h3 className="round-title">Round 1</h3>

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
              className={`Voting-restaurant-option ${selectedId === r.id ? "selected" : ""}`}
              onClick={() => setSelectedId(r.id)}
            >
              <img src={r.image} alt={r.name} />
            </div>
          ))}
          <button className="Voting-submit-button" onClick={handleVote} disabled={totalVotes >= MAX_VOTES}>
            Submit
          </button>
        </div>
      </div>

      <h2 className="Voting-results-title">Results</h2>
      <div className="Voting-results-section">
        {restaurants.map((r, i) => (
          <div key={i} className="result-row">
            <img src={r.image} alt={r.name} className="result-icon" />
            <div className="result-bar-container">
              <div
                className="result-bar"
                style={{ width: `${votes[r.id] * 130}px` }}  // the 110 is for how long the vote will appear on the bar
              />
            </div>
            <div className="vote-count">({votes[r.id]})</div>
          </div>
        ))}
      </div>
    </div>
  );
}
