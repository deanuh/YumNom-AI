import React from "react";
// for the votin page to receive the iamge of the restaurant chosen


function SelectedRestaurantDisplay({ restaurantObject, handleContinue }) {

  return (
    <div className="display-wrapper">
      <h3>You Chose:</h3>
      <div className="selection-display">
        {restaurantObject && (
          <>
            <div className="selected-image">
              <img
                src={`${restaurantObject.logo_url}`}
                alt={restaurantObject.name}
              />
            </div>
            <button className="voting-button" onClick={() => {handleContinue(restaurantObject.name)}}>Submit</button>
          </>
        )}
      </div>
    </div>
  );
}

export default SelectedRestaurantDisplay;

