import React from "react";

function SearchRestaurant({ restaurantOptions, search, setSearch, handleRestaurantSelect }) {
  return (
    <div className="restaurant-wrapper">

    <div className="restaurant-section">
      <h3>Select Restaurant</h3>
      <div className="group-search-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
        />
        <button onClick={() => handleRestaurantSelect(search)}>Enter</button>
      </div>

      <div className="group-search-results">
        {restaurantOptions
          .filter((r) => r.toLowerCase().includes(search.toLowerCase()))
          .map((r) => (
            <div
              className="restaurant-option"
              key={r}
              onClick={() => handleRestaurantSelect(r)}
            >
              {r}
            </div>
          ))}
      </div>
    </div>
    </div>
  );
}

export default SearchRestaurant;
