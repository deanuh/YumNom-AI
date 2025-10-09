import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
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

function GroupMealParty() {

	const base_url = process.env.REACT_APP_BACKEND_URL;
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
	const [restaurantObject, setRestaurantObject] = useState(null);
	const [restaurantOptions, setRestaurantOptions] = useState([]);
	const searchRestaurant = useCallback(async () => {

		const response = await axios.get(`${base_url}/restaurantFatSecret`, {
			params: {
				q: debouncedSearch,
			}
		});
		const objectData = response.data;

    let restaurantList = Array.isArray(objectData?.food_brands.food_brand) ? objectData.food_brands.food_brand : [];
		return restaurantList
	}, [base_url, debouncedSearch]);


	const searchLogo = useCallback(async () => {
		const response = await axios.get(`${base_url}/logo`, {
			params: {
				q: selectedRestaurant,
			}
		});
		return response.data;
	}, [base_url, selectedRestaurant]);
		
	useEffect(() => {
		const timeoutRef = setTimeout(() => {
				setDebouncedSearch(search);
		}, 2 * 1000);

		return () => {
			clearTimeout(timeoutRef)
		};
	}, [search]);
	
	useEffect(() => {
	  (async () => {
			if (debouncedSearch === "") {
				setRestaurantOptions([]);
			} else {
	    	const data = await searchRestaurant();
	    	setRestaurantOptions(data);
			}
	  })();
	}, [debouncedSearch, searchRestaurant]);
	
	// Fetch logo when selectedRestaurant changes
	useEffect(() => {
	  if (!selectedRestaurant) return;
	
	  (async () => {
	    const logoData = await searchLogo();
			console.log(logoData);
	    setRestaurantObject(logoData);
	  })();
	}, [selectedRestaurant, searchLogo]);

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
      

      <SelectedRestaurantDisplay restaurantObject={restaurantObject} handleContinue={handleContinue}/>
    </div>
  );
}

export default GroupMealParty;
