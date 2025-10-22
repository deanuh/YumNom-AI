import React, { useState, useEffect, useMemo } from "react";
import "../styles/restaurantSearch.css";
import DashboardSection from "../components/Dashboard/DashboardSection";
import DishCard from "../components/Dashboard/DishCard";
import Category from "../components/restaurantCategories";
import { getUserCity } from "../components/GetUserLoc";
import { getRestaurant } from "../components/GetRestaurant";
import { fetchMe } from "../userapi/meApi";

const DEFAULT_RADIUS_MI = 10;
const DEFAULT_UNITS = "mi";

// Quick category → query mapping for one-tap searches
const CATEGORY_TO_QUERY = {
  Bakery: "bakery",
  Burger: "burger",
  Beverage: "coffee", // or "beverage"
  Chicken: "chicken",
  Pizza: "pizza",
  Seafood: "seafood",
};

// "recently viewed)"" config for localStorage
const RECENTS_KEY = "yn_recent_restaurants";
const RECENTS_LIMIT = 12;

/**
 * Format distance (number or numeric string) to "X.X mi".
 * Examples: 2 -> "2.0 mi", "1.234" -> "1.2 mi"
 */
const formatDistance = (d) =>
  typeof d === "number" ? `${d.toFixed(1)} mi` : d ? `${Number(d).toFixed(1)} mi` : "";

/**
 * Construct a readable address string from the various possible API fields.
 * Falls back gracefully if some fields are missing.
 */
const formatAddress = (r) =>
  r.address_string ||
  [r.street1 || r.street || r.address, r.city, r.state, r.postcode || r.postalcode]
    .filter(Boolean)
    .join(", ");

/**
 * Normalize a string for simple fuzzy matching:
 * - lowercases
 * - strips non-alphanumeric characters
 */    
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function RestaurantSearch() {
// UI + request state

  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Location state (lat/lng + human-readable label) ----
  const [longLat, setlongLat] = useState(null);
  const [location, setLocation] = useState("Detecting...");
  const [searchResults, setSearchResults] = useState(null);
  //------------ NEW: location sharing toggle (default ON, persisted) ----------
  const [isSharing, setIsSharing] = useState(() => {
      try {
        const stored = localStorage.getItem("yumNomLocationSharing");
        if (stored !== null) return JSON.parse(stored);
        const legacy = localStorage.getItem("yumNomLocationOptOut");
        return legacy !== null ? !JSON.parse(legacy) : true;
      } 
      catch { return true; }
    });
    useEffect(() => {
      const onStorage = (e) => {
        if (e.key === "yumNomLocationSharing" && e.newValue != null) {  // is location on and there is a location - display info
          setIsSharing(JSON.parse(e.newValue));
        }
        if (e.key === "yumNomLocationOptOut" && e.newValue != null) {  // sharing is off, do not share location info
          setIsSharing(!JSON.parse(e.newValue));
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, []);

  // Currently active quick category (null when user types a query)
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Local "recently viewed" restaurants
  const [recents, setRecents] = useState([]);
  // Profile exclusions (restaurant names)
  const [excludedRestaurants, setExcludedRestaurants] = useState([]);

  // 1) On mount: detect user's city and lat/lng.
  //    This populates 'location' (for display) and 'longLat' (for API calls).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSharing) {
        setLocation("No location (sharing off)");
        setlongLat(null);
        return;
      }
      setLocation("Detecting...");
      try {
        const data = await getUserCity(); // honors opt-out; throws with .code
        if (!cancelled) {
          setLocation(`${data.city}, ${data.state}`);
          setlongLat({ longitude: data.longitude, latitude: data.latitude });
        }
      } catch (err) {
        if (!cancelled) {
          const code = err?.code;
          if (code === "GEO_DENIED") setLocation("Location permission denied.");
          else if (code === "GEO_OPT_OUT") setLocation("No location (sharing off)");
          else if (code === "BACKEND_UNAVAILABLE") setLocation("Location service unavailable.");
          else setLocation(err?.message || "Location unavailable");
          setlongLat(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isSharing]);

  // 2) Once we have lat/lng, auto-run a nearby search with default distance.
  //    We also reveal the results panel by default in this case.
  useEffect(() => {
    if (longLat?.latitude && longLat?.longitude) {
      setShowSearchResults(true); // show list by default
      const miles = selectedDistance ? Number(selectedDistance.split(" ")[0]) : DEFAULT_RADIUS_MI;
      // Empty query → "browse nearby"
      fetchRestaurants({ q: "", miles }); // no query → browse nearby
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [longLat]);

  // 3) Load "recents" from localStorage on mount.
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    setRecents(Array.isArray(saved) ? saved : []);
  }, []);

  // Load excluded restaurant names from user profile
  useEffect(() => {
      (async () => {
        try {
          const me = await fetchMe();
          const items = Array.isArray(me?.exclusions?.items) ? me.exclusions.items : [];
          setExcludedRestaurants(items);
        } catch (e) {
          // Non-fatal if profile isn't available yet
          console.warn("Unable to load profile exclusions:", e?.message || e);
        }
      })();
    }, []);

  /**
   * Add a restaurant to "recents":
   * - Builds a minimal object (id, name, address, imageUrl)
   * - De-dupes by id
   * - Trims to RECENTS_LIMIT
   * - Persists to localStorage
   */
  const addRecent = (r) => {
    const addr = formatAddress(r);
    const id = r.location_id || `${r.name}-${addr}`;
    const image =
      r.photoUrl || r.image_url || r.photo?.images?.large?.url || null;

    const item = {
      id,
      name: r.name,
      address: addr,
      imageUrl: image,
    };

    setRecents((prev) => {
      const filtered = (prev || []).filter((x) => x.id !== id);
      const next = [item, ...filtered].slice(0, RECENTS_LIMIT);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      return next;
    });
  };
  //Filter popover visibility + selected values
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);

  // Toggle helpers for dropdowns
  const toggleDistance = () => setShowDistanceDropdown(!showDistanceDropdown);
  const togglePrice = () => setShowPriceDropdown(!showPriceDropdown);

  /**
   * Compute the active query:
   * - If a category is selected, use its mapped term
   * - Otherwise use the text input
   */
  const currentQuery = () =>
    selectedCategory ? CATEGORY_TO_QUERY[selectedCategory] : (searchText || "").trim();
  /**
   * Manual search submit:
   * - Requires lat/lng (location detection)
   * - Clears selectedCategory (manual query overrides chip)
   * - Triggers fetch with current distance (or default)
   */
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

   /**
   * Category chip click:
   * - Sets selectedCategory
   * - Shows results panel
   * - Triggers fetch with the mapped term at the active/ default distance
   */
  const handleCategoryPick = (cat) => {
    setSelectedCategory(cat);
    setShowSearchResults(true);
    const miles = selectedDistance ? Number(selectedDistance.split(" ")[0]) : DEFAULT_RADIUS_MI;
    const q = CATEGORY_TO_QUERY[cat] || cat;
    fetchRestaurants({ q, miles });
  };

  /**
   * Core data fetch:
   * - Calls getRestaurant(long, lat, miles, units, q)
   * - Client-side post-filtering when q is present (simple contains check)
   * - Sorts by distance ascending
   * - Stores results in state
   *
   * Error handling:
   * - Sets user-friendly error message; console.error retains raw error for devs
   */
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
      
      // Defensive: TripAdvisor wrapper should return { data: [...] }
      let rows = Array.isArray(data?.data) ? data.data : [];

      // If a query exists, do a lenient, client-side fuzzy match on a few fields
      if (q) {
        const qNorm = norm(q);
        rows = rows.filter((r) =>
          [r.name, r.address_string, r.city, r.state].some((f) => norm(f).includes(qNorm))
        );
      }
      // Sort by numeric distance (missing values sink to bottom)
      rows = rows.slice().sort((a, b) => {
        const da = parseFloat(a?.distance);
        const db = parseFloat(b?.distance);
        return (Number.isFinite(da) ? da : Infinity) - (Number.isFinite(db) ? db : Infinity);
      });
       // Exclude restaurants from profile preferences (case-insensitive exact name match)
      if (excludedRestaurants?.length) {
          const ex = new Set(excludedRestaurants.map((n) => norm(n)));
          rows = rows.filter((r) => !ex.has(norm(r?.name)));
        }

      setSearchResults({ data: rows });
    } catch (e) {
      console.error(e);
      setError("Unable to fetch restaurants.");
    } finally {
      setLoading(false);
    }
  };
  /**
   * Clear all filters and search inputs:
   * - Resets distance, price, category, and text
   * - Closes dropdowns
   * - Refreshes results with default radius and empty query
   */
  const handleClearFilters = () => {
    setSelectedDistance(null);
    setSelectedPrice(null);
    setSelectedCategory(null);
    setSearchText("");
    setShowDistanceDropdown(false); // close distance dropdown
    setShowPriceDropdown(false);    // close price dropdown
    // Refresh results with defaults
    fetchRestaurants({ q: "", miles: DEFAULT_RADIUS_MI });
  };

  /**
   * Distance radio handler:
   * - Allows deselect (clicking the same value toggles off)
   * - Immediately re-fetches from server using the new distance
   */
  const handleDistanceRadio = (value) => {
    setSelectedDistance((prev) => {
      const next = prev === value ? null : value;
      const miles = next ? Number(next.split(" ")[0]) : DEFAULT_RADIUS_MI;
      fetchRestaurants({ q: currentQuery(), miles });
      return next;
    });
  };

  /**
   * Price radio handler:
   * - Only updates local state
   * - Price filtering stays client-side (no refetch)
   */
  const handlePriceRadio = (value) => {
    setSelectedPrice((prev) => (prev === value ? null : value));
  };

  /**
   * Memoized, price-filtered list of restaurants for display:
   * - If no price selected → return all current results
   * - Coerces different price fields into a normalized "$"..."$$$"
   */
  const displayed = useMemo(() => {
    const base = Array.isArray(searchResults?.data) ? searchResults.data : [];
    if (!selectedPrice) return base;

    const priceKey = (r) => r.price_level || r.price || r.price_range || null;
    return base.filter((r) => {
      const p = priceKey(r);
      if (!p) return true;  // keep items with unknown price
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
              placeholder="Search Resturant"
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
                <label><input
                  type="radio"
                  name="distance"
                  value="5 mi"
                  checked={selectedDistance === "5 mi"}
                  onChange={(e) => handleDistanceRadio(e.target.value)}
                /> 5 mi</label>
                <label><input
                  type="radio"
                  name="distance"
                  value="10 mi"
                  checked={selectedDistance === "10 mi"}
                  onChange={(e) => handleDistanceRadio(e.target.value)}
                /> 10 mi</label>
                <label><input
                  type="radio"
                  name="distance"
                  value="15 mi"
                  checked={selectedDistance === "15 mi"}
                  onChange={(e) => handleDistanceRadio(e.target.value)}
                /> 15 mi</label>
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
                <label><input
                  type="radio"
                  name="price"
                  value="$"
                  checked={selectedPrice === "$"}
                  onChange={(e) => handlePriceRadio(e.target.value)}
                /> $ </label>
                <label><input
                  type="radio"
                  name="price"
                  value="$$"
                  checked={selectedPrice === "$$"}
                  onChange={(e) => handlePriceRadio(e.target.value)}
                /> $$ </label>
                <label><input
                  type="radio"
                  name="price"
                  value="$$$"
                  checked={selectedPrice === "$$$"}
                  onChange={(e) => handlePriceRadio(e.target.value)}
                /> $$$ </label>
              </div>
            )}
          </div>
          <span className="clear-filters-link" onClick={handleClearFilters}>
            Clear filters
          </span>

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
                      imageUrl={r.photoUrl || r.image_url || r.photo?.images?.large?.url || null}
                      onViewMenu={() => {
                        addRecent(r);
                        // Then open Google Maps
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

      {recents.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 24 }}>
            <h4>Your Recent Searches</h4>
            {/* Optional "Clear all" link:
            <button
              className="link"
              onClick={() => { localStorage.removeItem(RECENTS_KEY); setRecents([]); }}
            >
              Clear all
            </button>
            */}
          </div>
          <div className="restaurant-grid">
            {recents.map((r) => (
              <DishCard
                key={r.id}
                name={r.name}
                address={r.address}
                imageUrl={r.imageUrl}
                onViewMenu={() => {
                  const q = encodeURIComponent(`${r.name} ${r.address}`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RestaurantSearch;
