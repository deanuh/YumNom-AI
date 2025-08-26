import React, { useState, useEffect } from "react";
import "../styles/restaurantSearch.css";
import DashboardSection from "../components/Dashboard/DashboardSection";
// import DishCard from "../components/Dashboard/DishCard";
import Category from "../components/restaurantCategories";
import { getUserCity } from "../components/GetUserLoc";
import { getRestaurant } from "../components/GetRestaurant";


function RestaurantSearch() {
	const [longLat, setlongLat] = useState(null);
  const [location, setLocation] = useState("Detecting...");
	const [searchResults, setSearchResults] = useState(null);
  useEffect(() => {
    getUserCity()
      .then((data) => {
        setLocation(`${data.city}, ${data.state}`);
				setlongLat({longitude: data.longitude, latitude: data.latitude});
        // can also use data.latitude, data.longitude for API filtering
      })
      .catch((err) => {
        setLocation(err);
      });
  }, []);

  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  // const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  // this will be for when the user selects distance and price options, it will show next to the filter button
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);


  const toggleDistance = () => {
    setShowDistanceDropdown(!showDistanceDropdown);
    // setShowRatingDropdown(false);
  };
  const togglePrice = () => {
    setShowPriceDropdown(!showPriceDropdown);
    // setShowRatingDropdown(false);
  };
  const toggleSearch = () => {
			
			var latitude = longLat.latitude;
			var longitude = longLat.longitude;
			var distanceParams =  selectedDistance ? selectedDistance.split(" ") : null;
			console.log(`${latitude}, ${longitude}, ${selectedDistance}`);
			if (!showSearchResults && longLat && distanceParams) {
	  	  getRestaurant(longitude, latitude, distanceParams[0], distanceParams[1])
				.then((data) => {
	  	  	setSearchResults(data);
					console.log(data);
				})
				.catch((err) => {
					setLocation(err);
				});
			}
			setShowSearchResults(!showSearchResults);
	};

  return (
    <div className="Restaurant-container">
      <h3 className="Restaurant-container-title">Restaurant Search</h3>
      <div>
        
      {/* LOCATION */}
      <div className="location-display">
        <span><strong>Current Location:</strong> {location}</span>
      </div>

      {/* SEARCH BAR */}
      <div className="Restaurant-search-bar-wrapper">
        <div className="Restaurant-search-bar">
          <span className="search-icon"> <img src="/search.png" alt="arrow" className="search-glass" /></span>
          <input type="text" placeholder="Search YumNom" />
        </div>
		{/* onClick is not a good event listener for toggleSearch, but its easy for now. 
			It would be better to check if the mouse was clicked while on the search bar or not */}
        <button onClick={toggleSearch} className="Restaurant-search-enter-button">Enter</button>
				{showSearchResults && (
				<div className="Restaurant-search-menu">
				<p>{JSON.stringify(searchResults)}</p>
				</div>
				)}
		</div>

      {/* FILTERS */}
      
      <div className="filters-bar">
      <div className="filter-pill1">Filters: </div>
      
        <div className="filter-dropdown">
          <button className="filter-pill" onClick={toggleDistance}>Distance {selectedDistance ? `: ${selectedDistance} `: ""}  
            <img src="/Vector.jpeg" alt="arrow" className="dropdown-arrow" /></button>
          {showDistanceDropdown && (
            <div className="dropdown-menu">
              <label><input type="radio" name="distance" value="5 mi" checked={selectedDistance === "5 mi"} onChange={(e) => setSelectedDistance(e.target.value)}/> 5 mi</label>
              <label><input type="radio" name="distance" value="10 mi" checked={selectedDistance === "10 mi"} onChange={(e) => setSelectedDistance(e.target.value)}/> 10 mi</label>
              <label><input type="radio" name="distance" value="15 mi" checked={selectedDistance === "15 mi"} onChange={(e) => setSelectedDistance(e.target.value)}/> 15 mi</label>
            </div>
          )}
        </div>

        <div className="filter-dropdown">
          <button className="filter-pill" onClick={togglePrice}>Price {selectedPrice ? `: ${selectedPrice}` : ""} <img src="/Vector.jpeg" alt="arrow" className="dropdown-arrow" /></button>
          {showPriceDropdown && (
            <div className="dropdown-menu">
            <label><input type="radio" name="price" value="$" checked={selectedPrice === "$"} onChange={(e) => setSelectedPrice(e.target.value)}/> $ </label>
            <label><input type="radio" name="price" value="$$" checked={selectedPrice === "$$"} onChange={(e) => setSelectedPrice(e.target.value)}/> $$ </label>
            <label><input type="radio" name="price" value="$$$" checked={selectedPrice === "$$$"} onChange={(e) => setSelectedPrice(e.target.value)}/> $$$ </label>
          </div>
          )}
      
        </div>
        </div>
      </div>

      {/* Categories */}
      <Category/>

      {/* Applied Filters */}
      <DashboardSection title="Applied Filters" />

      {/* Recently Searched */}
      <DashboardSection title="Your Recent Searches" />
    </div>
  );
}

export default RestaurantSearch;
