import "../styles/RestaurantPopup.css";
import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import Review  from './RestaurantPopup/Review.js';
import EmptyReview from './RestaurantPopup/EmptyReview.js';
import FillStar from './RestaurantPopup/FillStar.js';
import DynamicFillStar from './RestaurantPopup/DynamicFillStar.js';

export default function RestaurantPopup(props) {
	const [overallRating, setOverallRating] = useState(0);
	const [secondRating, setSecondRating] = useState(0);
	const [thirdRating, setThirdRating] = useState(0);
	const [fourthRating, setFourthRating] = useState(0);
	const [fifthRating, setFifthRating] = useState(0);
	const [review, setReview] = useState("");

// Helper function to make authenticated requests
async function fetchWithAuth(url, options = {}) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to perform this action.");
  }
  
  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return fetch(url, { ...options, headers });
}
//post request to backend
const submitReview = async () => {
  const user_ratings = [overallRating, secondRating, thirdRating, fourthRating, fifthRating];

  try {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ratings, review })
    };

    await fetchWithAuth(`${process.env.REACT_APP_BACKEND_URL}/ratings?q=${props?.ratingResponse?.name || ""}`, options);

    // Refresh ratings using previous restaurant name
		if (props?.ratingResponse?.name) {
    	await props.requestRatings(props.ratingResponse.name);
		}

    // Reset input fields
    setOverallRating(0);
    setSecondRating(0);
    setThirdRating(0);
    setFourthRating(0);
    setFifthRating(0);
    setReview("");

  } catch (err) {
    console.error(`submitReview failed: ${err.message}`);
  }
};	const handleChange = (e) => {
		setReview(e.target.value);
	};

// use for array in ratingResponse.
	const indexToDietMap = {
		0: "Overall",
		1: "Vegan",
		2: "Kosher",
		3: "Dairy Free",
		4: "Nut Free"
	}

//hide when not in use.
	if (!props.showPopup) return null;
	
	return (
		<div onClick={() => props.setShowPopup(false) } className={`popupcomponent-popup ${props.showPopup ? "show" : 'no-show'}`}>
			<div onClick={(e) => e.stopPropagation()} className="popupcomponent-box">
				<div className="popupcomponent-header">
					<div className="popupcomponent-header-brand">
						<img className="popupcomponent-brand-logo" src={props?.ratingResponse?.logo_url || "" } alt={props?.ratingResponse?.name || ""} /> 
						<h1 className="popupcomponent-brand-title"> {props?.ratingResponse?.name || ""} </h1>
					</div>
					<div className="popupcomponent-header-ratings"> 
						<div className="popupcomponent-ratings-overall"> 
							{(props?.ratingResponse?.average?.length > 0 
								? props?.ratingResponse?.average
								: [null, null, null, null, null]
								).map((r, i) => (
									<div>
										<FillStar title={indexToDietMap[i]} value={r} />
									</div>
							))}
						</div>
					</div>
				</div>
				<div className="popupcomponent-body">
					<h2 className="popupcomponent-body-title">Reviews</h2>
					<ul className="popupcomponent-body-reviews">
						{props?.ratingResponse?.recent_ratings?.length > 0 ? props.ratingResponse.recent_ratings.map((r, i) => {
								return (<Review key={i} entry={r} />);
							}) : <EmptyReview />
						}
					</ul>
					<div className="popupcomponent-body-input">
						<h3 className="popupcomponent-input-title">Submit Review</h3>
						<DynamicFillStar title={"Overall"}value={overallRating} onChange={setOverallRating}/>
						<DynamicFillStar title={"Vegan"}value={secondRating} onChange={setSecondRating}/>
						<DynamicFillStar title={"Kosher"}value={thirdRating} onChange={setThirdRating}/>
						<DynamicFillStar title={"Dairy Alternatives"}value={fourthRating} onChange={setFourthRating}/>
						<DynamicFillStar title={"Nut Free"}value={fifthRating} onChange={setFifthRating}/>
						<textarea value={review} onChange={handleChange} type="text" placeholder="Add your review here..."> </textarea>
						<button className="popupcomponent-input-submit" onClick={submitReview} >Submit Review</button>
					</div>
				</div>

			</div>

		</div>
	);
}
