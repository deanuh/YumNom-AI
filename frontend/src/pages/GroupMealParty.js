import React, { useState } from "react";
import "../styles/GroupMealParty.css";

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
  const [chosenRestaurant, setChosenRestaurant] = useState("");

  const handleRestaurantSelect = (rest) => setChosenRestaurant(rest);

    // BUILD selectedFriendObjects HERE (right before return)
  const selectedFriendObjects = selectedFriends
    .map(username => friendsList.find(friend => friend.username === username))
    .filter(Boolean);


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
        handleRestaurantSelect={handleRestaurantSelect}
      />
      

      <SelectedRestaurantDisplay chosenRestaurant={chosenRestaurant} selectedFriendObjects={ selectedFriendObjects}/>
    </div>
  );
}

export default GroupMealParty;
