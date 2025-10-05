import React, { useState } from "react";
import "../styles/GroupMealParty.css";
import { useNavigate } from "react-router-dom";

import InviteFriendList from "../components/GroupMealParty/InviteFriendList";
import AcceptedMembers from "../components/GroupMealParty/AcceptedMembers";
import HowItWorksInstructions from "../components/GroupMealParty/HowItWorksInstructions";
import SearchRestaurant from "../components/GroupMealParty/SearchRestaurant";
import SelectedRestaurantDisplay from "../components/GroupMealParty/SelectedRestaurantDisplay";

const friendsList = [
    { username: "apple", image: "apple.png" },
    { username: "hatsune_miku", image: "miku.png" },
    { username: "lebron", image: "lebron.png" },
    { username: "banana_gato", image: "ban_gato.png" },
    { username: "cattt", image: "gato.png" },
  ];
const restaurantOptions = ["Chipotle", "Chick-fil-a", "Pizza Hut", "WingStop"];


function GroupMealParty() {
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");

    // BUILD selectedFriendObjects HERE (right before return)
  const selectedFriendObjects = selectedFriends
    .map(username => friendsList.find(friend => friend.username === username))
    .filter(Boolean);

  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/RealTimeVoting", { state: { selectedRestaurant } }); 
    // Pass the restaurant name (or object) as state
  };


  return (
    <div className="group-meal-wrapper">
      <h2 className="title">!GROUP MEAL PARTY!</h2>

      <div className="party-grid">
        <div className="left-side">
            <InviteFriendList
            friendsList={friendsList}
            selectedFriends={selectedFriends}
            setSelectedFriends={setSelectedFriends}
            />
            <AcceptedMembers selectedFriends={selectedFriends} friendsList={friendsList} />
        </div>

        <div className="right-side">
            <HowItWorksInstructions />
        </div>
        
        </div>


      <SearchRestaurant
        restaurantOptions={restaurantOptions}
        search={search}
        setSearch={setSearch}
        setSelectedRestaurant={setSelectedRestaurant}
      />
      

      <SelectedRestaurantDisplay restaurantObject={selectedRestaurant} handleContinue={handleContinue}/>
    </div>
  );
}

export default GroupMealParty;
