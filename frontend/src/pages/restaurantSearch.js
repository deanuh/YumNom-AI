import React, { useState, useEffect, useMemo } from "react";
import "../styles/restaurantSearch.css";
import DashboardSection from "../components/Dashboard/DashboardSection";
import DishCard from "../components/Dashboard/DishCard";
import Category from "../components/restaurantCategories";
import { getUserCity } from "../components/GetUserLoc";
import { getRestaurant } from "../components/GetRestaurant";

const DEFAULT_RADIUS_MI = 10;
const DEFAULT_UNITS = "mi";

// ---- category mapping for quick searches ----
const CATEGORY_TO_QUERY = {
  Bakery: "bakery",
  Burger: "burger",
  Beverage: "coffee", // or "beverage"
  Chicken: "chicken",
  Pizza: "pizza",
  Seafood: "seafood",
};

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

  // NEW: track selected category
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    getUserCity()
      .then((data) => {
        setLocation(`${data.city}, ${data.state}`);
        setlongLat({ longitude: data.longitude, latitude: data.latitude });
      })
      .catch((err) => setLocation(err));
  }, []);

  useEffect(() => {
    if (longLat?.latitude && longLat?.longitude) {
      setShowSearchResults(true); // show list by default
      const miles = selectedDistance ? Number(selectedDistance.split(" ")[0]) : DEFAULT_RADIUS_MI;
      fetchRestaurants({ q: "", miles }); // no query → browse nearby
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [longLat]);

  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);

  const toggleDistance = () => setShowDistanceDropdown(!showDistanceDropdown);
  const togglePrice = () => setShowPriceDropdown(!showPriceDropdown);

  // Helper: what query should we use right now?
  const currentQuery = () =>
    selectedCategory ? CATEGORY_TO_QUERY[selectedCategory] : (searchText || "").trim();

  const handleSearch = () => {
    const latitude = longLat?.latitude;
    const longitude = longLat?.longitude;

    setShowSearchResults(true);
    if (!latitude || !longitude) {
      setError("Allow location to load.");
      return;
    }

    // If user manually searches, clear any active category
    if (selectedCategory) setSelectedCategory(null);

    setError("");
    const miles = selectedDistance ? Number(selectedDistance.split(" ")[0]) : DEFAULT_RADIUS_MI;
    fetchRestaurants({ q: (searchText || "").trim(), miles });
  };

  // NEW: category click → run same search flow with preset term
  const handleCategoryPick = (cat) => {
    setSelectedCategory(cat);
    setShowSearchResults(true);
    const miles = selectedDistance ? Number(selectedDistance.split(" ")[0]) : DEFAULT_RADIUS_MI;
    const q = CATEGORY_TO_QUERY[cat] || cat;
    fetchRestaurants({ q, miles });
  };

  const fetchRestaurants = async ({ q, miles }) => {
    if (!longLat?.latitude || !longLat?.longitude) return;
    setLoading(true);
    setError("");

    const distanceMiles = miles ?? DEFAULT_RADIUS_MI;
    const units = DEFAULT_UNITS;

    try {
      const data = await getRestaurant(
        longLat.longitude,
        longLat.latitude,
        distanceMiles,
        units,
        (q || "").trim()
      );

      let rows = Array.isArray(data?.data) ? data.data : [];

      if (q) {
        const qNorm = norm(q);
        rows = rows.filter((r) =>
          [r.name, r.address_string, r.city, r.state].some((f) => norm(f).includes(qNorm))
        );
      }

      rows = rows.slice().sort((a, b) => {
        const da = parseFloat(a?.distance);
        const db = parseFloat(b?.distance);
        return (Number.isFinite(da) ? da : Infinity) - (Number.isFinite(db) ? db : Infinity);
      });

      setSearchResults({ data: rows });
    } catch (e) {
      console.error(e);
      setError("Unable to fetch restaurants.");
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: distance change re-queries with current category/text
  const handleDistanceChange = (val) => {
    setSelectedDistance(val);
    const miles = Number(val.split(" ")[0]);
    fetchRestaurants({ q: currentQuery(), miles });
  };

  // Price filter stays client-side
  const displayed = useMemo(() => {
    const base = Array.isArray(searchResults?.data) ? searchResults.data : [];
    if (!selectedPrice) return base;

    const priceKey = (r) => r.price_level || r.price || r.price_range || null;
    return base.filter((r) => {
      const p = priceKey(r);
      if (!p) return true;
      const normalized =
        typeof p === "number" ? "$".repeat(Math.max(1, Math.min(4, p))) : String(p).trim();
      return normalized === selectedPrice;
    });
  }, [searchResults, selectedPrice]);

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
            <span className="search-icon">
              <img src="/search.png" alt="arrow" className="search-glass" />
            </span>
            <input
              type="text"
              placeholder="Search YumNom"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="Restaurant-search-enter-button">Enter</button>
        </div>

        {/* FILTERS */}
        <div className="filters-bar">
          <div className="filter-pill1">Filters: </div>

          <div className="filter-dropdown">
            <button className="filter-pill" onClick={toggleDistance}>
              Distance {selectedDistance ? `: ${selectedDistance} ` : ""}
              <img src="/Vector.jpeg" alt="arrow" className="dropdown-arrow" />
            </button>
            {showDistanceDropdown && (
              <div className="dropdown-menu">
                <label><input type="radio" name="distance" value="5 mi"
                  checked={selectedDistance === "5 mi"}
                  onChange={(e) => handleDistanceChange(e.target.value)} /> 5 mi</label>
                <label><input type="radio" name="distance" value="10 mi"
                  checked={selectedDistance === "10 mi"}
                  onChange={(e) => handleDistanceChange(e.target.value)} /> 10 mi</label>
                <label><input type="radio" name="distance" value="15 mi"
                  checked={selectedDistance === "15 mi"}
                  onChange={(e) => handleDistanceChange(e.target.value)} /> 15 mi</label>
              </div>
            )}
          </div>

          <div className="filter-dropdown">
            <button className="filter-pill" onClick={togglePrice}>
              Price {selectedPrice ? `: ${selectedPrice}` : ""}
              <img src="/Vector.jpeg" alt="arrow" className="dropdown-arrow" />
            </button>
            {showPriceDropdown && (
              <div className="dropdown-menu">
                <label><input type="radio" name="price" value="$"
                  checked={selectedPrice === "$"}
                  onChange={(e) => setSelectedPrice(e.target.value)} /> $ </label>
                <label><input type="radio" name="price" value="$$"
                  checked={selectedPrice === "$$"}
                  onChange={(e) => setSelectedPrice(e.target.value)} /> $$ </label>
                <label><input type="radio" name="price" value="$$$"
                  checked={selectedPrice === "$$$"}
                  onChange={(e) => setSelectedPrice(e.target.value)} /> $$$ </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories (now clickable) */}
      <Category onPick={handleCategoryPick} active={selectedCategory} />

      {/* Results */}
      {showSearchResults && (
        <>
          <div className="section-header">
            <h4>Nearby Restaurants</h4>
          </div>

          {loading && <p>Loading nearby restaurants…</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !error && (
            <>
              {Array.isArray(displayed) && displayed.length > 0 ? (
                <div className="restaurant-grid">
                  {displayed.map((r) => (
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
