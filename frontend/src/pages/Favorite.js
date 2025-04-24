import React, { useState } from "react";
import "../styles/favorite.css";
import DishCard from "../components/Dashboard/DishCard";

function Favorite() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeType, setActiveType] = useState("restaurants");

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  return (
    <div className="favorite-page">
      <div className="favorite-header">
        <h2 className="favorite-title">Favorites</h2>

        <div className="dropdown-wrapper">
        <button className="dropdown-toggle" onClick={toggleDropdown}>
        {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
        <img src="/Vector.jpeg" alt="arrow" className="dropdown-arrow" />
        </button>


          {showDropdown && (
            <div className="dropdown-menu">
              <label>
                <input
                  type="checkbox"
                  checked={activeType === "restaurants"}
                  onChange={() => setActiveType("restaurants")}
                />
                Restaurants
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={activeType === "dishes"}
                  onChange={() => setActiveType("dishes")}
                />
                Dish
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="favorites-grid">
        {activeType === "restaurants" && (
          <>
            <DishCard />
            <DishCard />
            <DishCard />
            <DishCard />
            <DishCard />
            <DishCard />
          </>
        )}
        {activeType === "dishes" && (
          <>
            <DishCard />
            <DishCard />
            <DishCard />
            <DishCard />
          </>
        )}
      </div>
    </div>
  );
}

export default Favorite;
