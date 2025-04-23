import React, { useState } from "react";
import "../styles/restaurantSearch.css";
import DashboardSection from "../components/Dashboard/DashboardSection";
import DishCard from "../components/Dashboard/DishCard";
import Category from "../components/restaurantCategories";


function RestaurantSearch() {
  const [location] = useState("Long Beach, CA");
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);

  const toggleDistance = () => {
    setShowDistanceDropdown(!showDistanceDropdown);
    setShowRatingDropdown(false);
  };

  const toggleRating = () => {
    setShowRatingDropdown(!showRatingDropdown);
    setShowDistanceDropdown(false);
  };

  return (
    <div className="search-page">
      {/* LOCATION */}
      <div className="location-box">
        <span><strong>Current Location:</strong> {location}</span>
      </div>

      {/* SEARCH BAR */}
      <div className="search-bar-wrapper">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search YumNom" />
        </div>
        <button className="enter-button">Enter</button>
      </div>

      {/* FILTERS */}
      <div className="filters-bar">
        <div className="filter-dropdown">
          <button className="filter-pill" onClick={toggleDistance}>Distance ⌄</button>
          {showDistanceDropdown && (
            <div className="dropdown-menu">
              <label><input type="radio" name="distance" /> 5 mi</label>
              <label><input type="radio" name="distance" /> 10 mi</label>
              <label><input type="radio" name="distance" /> 15 mi</label>
            </div>
          )}
        </div>

        <div className="filter-dropdown">
          <button className="filter-pill" onClick={toggleRating}>Rating ⌄</button>
          {showRatingDropdown && (
            <div className="dropdown-menu">
              {[1, 2, 3, 4, 5].map((count) => (
                <label key={count} className="star-label">
                    <input type="checkbox" />
                    <div className="star-row">
                    {[...Array(count)].map((_, i) => (
                        <img key={i} src="/star.png" alt="star" className="star-icon" />
                    ))}
                    </div>
                </label>
                ))}


            </div>
          )}
        </div>

        <div className="filter-pill">
          <label><input type="checkbox" defaultChecked /> Fast Food</label>
          <label><input type="checkbox" /> Dine-In</label>
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
