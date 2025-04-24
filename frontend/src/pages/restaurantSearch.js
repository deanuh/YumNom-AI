import React, { useState, useEffect } from "react";
import "../styles/restaurantSearch.css";
import DashboardSection from "../components/Dashboard/DashboardSection";
// import DishCard from "../components/Dashboard/DishCard";
import Category from "../components/restaurantCategories";
import { getUserCity } from "../components/GetUserLoc";


function RestaurantSearch() {
  const [location, setLocation] = useState("Detecting...");
  useEffect(() => {
    getUserCity()
      .then((data) => {
        setLocation(`${data.city}, ${data.state}`);
        // can also use data.latitude, data.longitude for API filtering
      })
      .catch((err) => {
        setLocation(err);
      });
  }, []);

  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  // const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
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

  return (
    <div className="Restaurant-container">
      <div>
        
      {/* LOCATION */}
      <div className="location-display">
        <span><strong>Current Location:</strong> {location}</span>
      </div>

      {/* SEARCH BAR */}
      <div className="search-bar-wrapper">
        <div className="search-bar">
          <span className="search-icon"> <img src="/search.png" alt="arrow" className="search-glass" /></span>
          <input type="text" placeholder="Search YumNom" />
        </div>
        <button className="enter-button">Enter</button>
      </div>

      {/* FILTERS */}
      
      <div className="filters-bar">
      <div className="filter-pill1">Filters: </div>
      
        <div className="filter-dropdown">
          <button className="filter-pill" onClick={toggleDistance}>Distance{selectedDistance ? `: ${selectedDistance} `: ""}  
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
          <button className="filter-pill" onClick={togglePrice}>Price{selectedPrice ? `: ${selectedPrice}` : ""}<img src="/Vector.jpeg" alt="arrow" className="dropdown-arrow" /></button>
          {showPriceDropdown && (
            <div className="dropdown-menu">
              {/* TODO: fix up the buttons like Distance */}
              <label><input type="radio" name="distance" /> 5 mi</label>
              <label><input type="radio" name="distance" /> 10 mi</label>
              <label><input type="radio" name="distance" /> 15 mi</label>
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
      <DashboardSection title="Your Recent AI Dish Recommendation!" />
    </div>
  );
}

export default RestaurantSearch;
