import React from "react";

function SearchRestaurant({ restaurantOptions, search, setSearch, setSelectedRestaurant}) {
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
        <button onClick={() => setSelectedRestaurant(search)}>Enter</button>
      </div>

      <div className="group-search-results">
        {restaurantOptions
          .filter((r) => (r.toLowerCase().includes(search.toLowerCase()))).slice(0, 10)// maybe change later to change 10 to some other number.
          .map((r) => (
            <div
              className="restaurant-option"
              key={r}
              onClick={() => setSelectedRestaurant(r)}
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
