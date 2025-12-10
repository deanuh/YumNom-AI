import React from "react";
import FillStar from "./FillStar.js";
import "../../styles/RestaurantPopup.css";

//used per object in recent_ratings array.
export default function Review(props) {
  const { entry } = props;

  // Map rating index to category labels
  const indexToDietMap = {
    0: "Overall",
    1: "Vegan",
    2: "Kosher",
    3: "Dairy Free",
    4: "Nut Free",
  };

  if (!entry) return null;

  return (
    <li className="popupcomponent-reviews-entry">
      {/* --- User Info Section --- */}
			<div className="popupcomponent-entry-row">
	      <div className="popupcomponent-row-user">
	        <img
	          className="popupcomponent-user-profile-picture"
	          src={entry.profile_picture || "ban_gato.png"}
	          alt={entry.username || "Anonymous"}
	        />
	        <span className="popupcomponent-user-username">
	          {entry.username || "Anonymous"}
	        </span>
	      </div>
	
	      {/* --- Ratings Section --- */}
	      <div className="popupcomponent-row-ratings">
	        <div className="popupcomponent-ratings-column">
	          <div className="popupcomponent-column-scores">
	            {(entry.user_ratings?.length ? entry.user_ratings : []).map((r, i) => (
	              <div key={i} className="popupcomponent-rating-row">
	                <span className="popupcomponent-rating-value">
	                  {r === -99 ? (
	                    <span className="popupcomponent-rating-none">None</span>
	                  ) : (
	                    <FillStar title={indexToDietMap[i]} value={r} />
	                  )}
	                </span>
	              </div>
	            ))}
	          </div>
	        </div>
	        {/* --- Review Text --- */}
	      </div>
			</div>
      <p className="popupcomponent-ratings-text">{`"${entry.review}"` || ""}</p>
    </li>
  );
}

