import React from "react";
// for the votin page to receive the iamge of the restaurant chosen
import { useNavigate } from "react-router-dom";


function SelectedRestaurantDisplay({ chosenRestaurant }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/RealTimeVoting", { state: { chosenRestaurant } }); 
    // Pass the restaurant name (or object) as state
  };

  return (
    <div className="display-wrapper">
      <h3>You Chose:</h3>
      <div className="selection-display">
        {chosenRestaurant && (
          <>
            <div className="selected-image">
              <img
                src={`/${chosenRestaurant.toLowerCase()}.png`}
                alt={chosenRestaurant}
              />
            </div>
            <button className="voting-button" onClick={handleContinue}>Continue to Voting</button>
          </>
        )}
      </div>
    </div>
  );
}

export default SelectedRestaurantDisplay;

