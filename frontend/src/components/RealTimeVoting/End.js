import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import RestaurantPopup from '../RestaurantPopup.js'


export default function End(props) {
	const [ratingResponse, setRatingResponse] = useState(null);
	const [showPopup, setShowPopup] = useState(false);
	const requestRatings = async (name) => {
		const base_url = process.env.REACT_APP_BACKEND_URL;

		try {
			const response = await axios.get(`${base_url}/restaurantRatings`, {
				headers: {
					"Content-Type": "application/json",
				},
				params: {
					q: name
				}
			});
			setRatingResponse(response.data);
		} catch (error) {
			console.error(`restaurantRatings error: ${error}`);
		}
	};
	
	useEffect(() => {
		if (!props.winner) return;
		const restaurantObject = props.finalRestaurants.find((restaurant) => restaurant.id === props.winner);
		try {
			requestRatings(restaurantObject.name)
		} catch (err) {
			console.error(`couldn't find rating for restaurant "${restaurantObject.name}"`)
		}
	}, [props.finalRestaurants, props.winner]);

return (
    <div className="voting-page">
      <div className="voting-title-container">
        <h1 className="voting-title">RESULTS</h1>
      </div>
      <div className="voting-section">
      	<div className="party-column">
      	  <h4>Party Members</h4>
      	      {Object.keys(props.partyMembers).map((memberKey) => {
      	      const member = props.partyMembers[memberKey];
      	      return (
      	      <div key={memberKey} className="party-avatar">
      	        <img src={`/${member.profile_picture}`} alt={member.username} />
      	        <div>{member.username}</div>
      	      </div>
      	    );
      	    })}
				</div>
			<div className="End-results-section">
			{(() => { 
				const restaurantObject = props.finalRestaurants.find(restaurant => restaurant.id === props.winner);
				return (
					<div>
						<img className="End-results-icon" onClick={() => setShowPopup(!showPopup)} src={restaurantObject?.image} alt={restaurantObject?.name} />
						<div>{restaurantObject?.name}</div>
					</div>
				);
			})()}
			{createPortal(<RestaurantPopup requestRatings={requestRatings} finalRestaurants={props.finalRestaurants} winner={props.winner} ratingResponse={ratingResponse} showPopup={showPopup} setShowPopup={setShowPopup}/>, document.body)}
			</div>

      </div>
    </div>
);
}
