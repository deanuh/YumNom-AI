import React from "react";

function SelectedRestaurantDisplay({ chosenRestaurant }) {
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
            <button className="voting-button">Continue to Voting</button>
          </>
        )}
      </div>
    </div>
  );
}

export default SelectedRestaurantDisplay;

