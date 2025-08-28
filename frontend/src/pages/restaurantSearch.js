import React, { useState, useEffect } from "react";
import "../styles/restaurantSearch.css";
import DashboardSection from "../components/Dashboard/DashboardSection";
import DishCard from "../components/Dashboard/DishCard";
import Category from "../components/restaurantCategories";
import { getUserCity } from "../components/GetUserLoc";
import { getRestaurant } from "../components/GetRestaurant";

const formatDistance = (d) =>
  typeof d === "number" ? `${d.toFixed(1)} mi` : d ? `${Number(d).toFixed(1)} mi` : "";

const formatAddress = (r) =>
  r.address_string ||
  [r.street1 || r.street || r.address, r.city, r.state, r.postcode || r.postalcode]
    .filter(Boolean)
    .join(", ");

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");


function RestaurantSearch() {
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    const latitude = longLat?.latitude;
    const longitude = longLat?.longitude;
    const distanceParams = selectedDistance ? selectedDistance.split(" ") : null;
  
    setShowSearchResults(true);
  
    if (!latitude || !longitude || !distanceParams) {
      setError("Choose a distance and allow location to load.");
      return;
    }
  
    setError("");
    setLoading(true);
  
    const q = (searchText || "").trim();
    const miles = distanceParams[0];
    const units = distanceParams[1]; // "mi"
  
    // Always pass q + lat/lng so backend can compute distance.
    // We still filter client-side to be safe.
    getRestaurant(longitude, latitude, miles, units, q)
      .then((data) => {
        let rows = Array.isArray(data?.data) ? data.data : [];
  
        // Flexible filter for the text box (handles punctuation/case)
        if (q) {
          const qNorm = norm(q);
          rows = rows.filter((r) =>
            [r.name, r.address_string, r.city, r.state]
              .some((field) => norm(field).includes(qNorm))
          );
        }
  
        // Always sort by distance ascending (if distance exists)
        rows = rows.slice().sort((a, b) => {
          const da = parseFloat(a?.distance);
          const db = parseFloat(b?.distance);
          return (Number.isFinite(da) ? da : Infinity) - (Number.isFinite(db) ? db : Infinity);
        });
  
        setSearchResults({ data: rows });
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to fetch restaurants.");
      })
      .finally(() => setLoading(false));
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
          <input
            type="text"
            placeholder="Search YumNom"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && toggleSearch()}
          />
        </div>
		{/* onClick is not a good event listener for toggleSearch, but its easy for now. 
			It would be better to check if the mouse was clicked while on the search bar or not */}
        <button onClick={toggleSearch} className="Restaurant-search-enter-button">Enter</button>
      

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
      {/* Nearby (search) results */}
{showSearchResults && (
  <>
    <div className="section-header">
      <h4>Nearby Restaurants</h4>
      {/* optional: View all link */}
    </div>

    {loading && <p>Loading nearby restaurants…</p>}
    {error && <p className="error">{error}</p>}

    {!loading && !error && (
      <>
        {Array.isArray(searchResults?.data) && searchResults.data.length > 0 ? (
          <div className="restaurant-grid">
            {searchResults.data.map((r) => (
              <DishCard
                key={r.location_id || `${r.name}-${r.address_string}`}
                name={r.name}
                address={formatAddress(r)}
                distance={formatDistance(r.distance)}
                onViewMenu={() => {
                  const q = encodeURIComponent(`${r.name} ${formatAddress(r)}`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
                }}
              />
            ))}
          </div>
        ) : (
          <p>No restaurants found with the current filters.</p>
        )}
      </>
    )}
  </>
)}


      {/* Recently Searched */}
      <DashboardSection title="Your Recent Searches" />
    </div>
  );
}

export default RestaurantSearch;
